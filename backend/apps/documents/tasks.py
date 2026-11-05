import os
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from celery import shared_task
from django.conf import settings
from django.core.mail import get_connection
from django.template.loader import render_to_string

_LOGO_PATH = os.path.join(
    os.path.dirname(__file__), "templates", "emails", "logo.png"
)


def _send(subject: str, template: str, context: dict, recipient: str):
    html = render_to_string(template, context)
    text = f"Assalâmou Alaïkoum,\n\n{subject}"

    # multipart/related so Gmail shows the CID logo inline
    outer = MIMEMultipart("related")
    outer["Subject"] = subject
    outer["From"] = settings.DEFAULT_FROM_EMAIL
    outer["To"] = recipient

    alt = MIMEMultipart("alternative")
    alt.attach(MIMEText(text, "plain", "utf-8"))
    alt.attach(MIMEText(html, "html", "utf-8"))
    outer.attach(alt)

    if os.path.exists(_LOGO_PATH):
        with open(_LOGO_PATH, "rb") as f:
            img = MIMEImage(f.read())
        img.add_header("Content-ID", "<dmn_logo>")
        img.add_header("Content-Disposition", "inline", filename="logo.png")
        outer.attach(img)

    conn = get_connection()
    conn.open()
    conn.connection.sendmail(
        settings.EMAIL_HOST_USER,
        [recipient],
        outer.as_string(),
    )
    conn.close()


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
def calculer_pages(self, doc_id: str):
    import pdfplumber
    from .models import Document
    try:
        doc = Document.objects.get(id=doc_id)
    except Document.DoesNotExist:
        return
    if not doc.fichier:
        return
    try:
        with doc.fichier.open("rb") as f:
            with pdfplumber.open(f) as pdf:
                nb_pages = len(pdf.pages)
        Document.objects.filter(pk=doc.pk).update(pages=nb_pages)
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
