import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def _send(subject: str, template: str, context: dict, recipient: str):
    # Logo en URL publique plutot qu'en piece jointe CID : Django 6 a retire
    # le support de `mixed_subtype` (necessaire pour un multipart/related),
    # et attacher un fichier force de toute facon un multipart/mixed - donc
    # plus simple et plus fiable de pointer vers l'image hebergee.
    context = {**context, "logo_url": f"{settings.FRONTEND_URL}/logo.png"}
    html = render_to_string(template, context)
    text = f"Assalâmou Alaïkoum,\n\n{subject}"

    # EmailMultiAlternatives (plutôt que des objets email.mime construits à
    # la main) pour que Django ajoute les en-têtes Date/Message-ID requis —
    # un message qui en est dépourvu est accepté sans erreur par le relais
    # SMTP mais silencieusement jeté par Gmail, sans même atterrir en spam.
    msg = EmailMultiAlternatives(
        subject=subject,
        body=text,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[recipient],
    )
    msg.attach_alternative(html, "text/html")
    msg.send()


def _get_admin_recipients(flag: str):
    """Retourne les emails des admins ayant le flag de notification activé."""
    from apps.accounts.models import User
    return list(
        User.objects.filter(role="admin", **{flag: True})
        .exclude(email="")
        .values_list("email", flat=True)
    )


def _send_to_many(subject: str, template: str, context: dict, recipients: list):
    for email in recipients:
        try:
            _send(subject, template, context, email)
        except Exception:
            pass


@shared_task(queue="default", bind=True, max_retries=3)
def traiter_pdf(self, doc_id: str):
    """Compte les pages et extrait le texte du PDF (pour la recherche), en
    tache async pour ne pas bloquer la reponse HTTP de soumission.

    L'extraction de texte est ce qui permet a la recherche de trouver un
    document par son theme reel meme si personne n'a pense a le mentionner
    dans le titre, le resume ou les mots-cles — voir search.py.
    """
    import pdfplumber
    from .models import Document
    from . import search
    try:
        doc = Document.objects.get(id=doc_id)
    except Document.DoesNotExist:
        return
    if not doc.fichier:
        return

    # Cap a ~60 pages / 40000 caracteres : suffisant pour la pertinence de
    # recherche sans faire exploser la taille du document en base/index.
    MAX_PAGES, MAX_CHARS = 60, 40_000
    try:
        with doc.fichier.open("rb") as f:
            with pdfplumber.open(f) as pdf:
                nb_pages = len(pdf.pages)
                chunks = []
                total = 0
                for page in pdf.pages[:MAX_PAGES]:
                    text = page.extract_text() or ""
                    chunks.append(text)
                    total += len(text)
                    if total >= MAX_CHARS:
                        break
                texte = "\n".join(chunks)[:MAX_CHARS]
        Document.objects.filter(pk=doc.pk).update(pages=nb_pages, contenu_texte=texte)
        doc.refresh_from_db(fields=["statut"])
        if doc.statut == "approuve":
            # Deja indexe sans le texte si l'admin a approuve avant la fin de
            # cette tache — on reindexe pour que la recherche en beneficie.
            doc.contenu_texte = texte
            search.index_document(doc)
    except Exception:
        pass


@shared_task(queue="default", bind=True, max_retries=3)
def notifier_admins_soumission(self, doc_id: str):
    from .models import Document
    try:
        doc = Document.objects.select_related("soumis_par", "faculte").get(id=doc_id)
    except Document.DoesNotExist:
        return
    recipients = _get_admin_recipients("notify_soumission")
    if not recipients:
        return
    auteur = doc.soumis_par.get_full_name() if doc.soumis_par else "Inconnu"
    try:
        _send_to_many(
            subject=f"[DMN-BN] Nouvelle soumission — {doc.titre}",
            template="emails/admin_soumission.html",
            context={"doc": doc, "auteur": auteur},
            recipients=recipients,
        )
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@shared_task(queue="default", bind=True, max_retries=3)
def notifier_admins_approbation(self, doc_id: str):
    from .models import Document
    try:
        doc = Document.objects.select_related("soumis_par").get(id=doc_id)
    except Document.DoesNotExist:
        return
    recipients = _get_admin_recipients("notify_approbation")
    if not recipients:
        return
    auteur = doc.soumis_par.get_full_name() if doc.soumis_par else "Inconnu"
    try:
        _send_to_many(
            subject=f"[DMN-BN] Document approuvé — {doc.titre}",
            template="emails/admin_approbation.html",
            context={"doc": doc, "auteur": auteur},
            recipients=recipients,
        )
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@shared_task(queue="default", bind=True, max_retries=3)
def notifier_admins_rejet(self, doc_id: str):
    from .models import Document
    try:
        doc = Document.objects.select_related("soumis_par").get(id=doc_id)
    except Document.DoesNotExist:
        return
    recipients = _get_admin_recipients("notify_rejet")
    if not recipients:
        return
    auteur = doc.soumis_par.get_full_name() if doc.soumis_par else "Inconnu"
    try:
        _send_to_many(
            subject=f"[DMN-BN] Document rejeté — {doc.titre}",
            template="emails/admin_rejet.html",
            context={"doc": doc, "auteur": auteur},
            recipients=recipients,
        )
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@shared_task(queue="default", bind=True, max_retries=3)
def notifier_admins_compte(self, user_id: str):
    from apps.accounts.models import User
    try:
        membre = User.objects.select_related("faculte", "filiere", "niveau").get(id=user_id)
    except User.DoesNotExist:
        return
    recipients = _get_admin_recipients("notify_compte")
    if not recipients:
        return
    nom = membre.get_full_name() or membre.username
    try:
        _send_to_many(
            subject=f"[DMN-BN] Nouveau membre — {nom}",
            template="emails/admin_nouveau_compte.html",
            context={
                "membre": nom,
                "email": membre.email,
                "faculte": membre.faculte,
                "filiere": membre.filiere,
                "niveau": membre.niveau,
            },
            recipients=recipients,
        )
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@shared_task(queue="default", bind=True, max_retries=3)
def envoyer_email_reset_password(self, user_id: str, reset_url: str):
    from apps.accounts.models import User
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return
    nom = user.get_full_name() or user.username
    try:
        _send(
            subject="[DMN-BN] Réinitialisation de votre mot de passe",
            template="emails/reset_password.html",
            context={"nom": nom, "reset_url": reset_url},
            recipient=user.email,
        )
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@shared_task(queue="default", bind=True, max_retries=3)
def notifier_bienvenue_membre(self, user_id: str, password: str):
    from apps.accounts.models import User
    try:
        membre = User.objects.select_related("faculte", "filiere", "niveau").get(id=user_id)
    except User.DoesNotExist:
        return
    if not membre.email:
        return
    from django.conf import settings as _s
    login_url = getattr(_s, "FRONTEND_URL", "http://localhost") + "/connexion"
    nom = membre.get_full_name() or membre.username
    try:
        _send(
            subject="[DMN-BN] Bienvenue — vos identifiants de connexion",
            template="emails/membre_bienvenue.html",
            context={
                "nom": nom,
                "username": membre.username,
                "password": password,
                "email": membre.email,
                "login_url": login_url,
            },
            recipient=membre.email,
        )
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@shared_task(queue="default", bind=True, max_retries=3)
def notifier_changement_mdp(self, user_id: str, password: str):
    """Notifie l'utilisateur que son mot de passe a été modifié par un admin."""
    from apps.accounts.models import User
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return
    if not user.email:
        return
    from django.conf import settings as _s
    login_url = getattr(_s, "FRONTEND_URL", "http://localhost") + "/connexion"
    nom = user.get_full_name() or user.username
    try:
        _send(
            subject="[DMN-BN] Votre mot de passe a été modifié",
            template="emails/membre_nouveau_mdp.html",
            context={
                "nom": nom,
                "username": user.username,
                "password": password,
                "login_url": login_url,
            },
            recipient=user.email,
        )
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@shared_task(queue="default", bind=True, max_retries=3)
def notifier_approbation(self, doc_id: str):
    from .models import Document
    try:
        doc = Document.objects.select_related("soumis_par").get(id=doc_id)
    except Document.DoesNotExist:
        return

    destinataire = doc.soumis_par
    if not destinataire or not destinataire.email or destinataire.role == "admin":
        logger.warning(
            "notifier_approbation: pas d'email envoye pour le document %s (soumis_par=%s) "
            "— compte supprime/sans email/admin.",
            doc_id, destinataire.id if destinataire else None,
        )
        return

    nom = destinataire.get_full_name() or destinataire.username
    try:
        _send(
            subject=f"[DMN-BN] Votre document a été approuvé — {doc.titre}",
            template="emails/approbation.html",
            context={"doc": doc, "nom": nom},
            recipient=destinataire.email,
        )
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@shared_task(queue="default", bind=True, max_retries=3)
def notifier_rejet(self, doc_id: str):
    from .models import Document
    try:
        doc = Document.objects.select_related("soumis_par").get(id=doc_id)
    except Document.DoesNotExist:
        return

    destinataire = doc.soumis_par
    if not destinataire or not destinataire.email or destinataire.role == "admin":
        logger.warning(
            "notifier_rejet: pas d'email envoye pour le document %s (soumis_par=%s) "
            "— compte supprime/sans email/admin.",
            doc_id, destinataire.id if destinataire else None,
        )
        return

    nom = destinataire.get_full_name() or destinataire.username
    try:
        _send(
            subject=f"[DMN-BN] Décision de la Commission Pédagogique — {doc.titre}",
            template="emails/rejet.html",
            context={"doc": doc, "nom": nom},
            recipient=destinataire.email,
        )
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)
