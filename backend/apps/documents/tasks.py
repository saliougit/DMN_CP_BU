from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings


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

    nom = destinataire.get_full_name() or destinataire.email
    try:
        send_mail(
            subject=f"[DMN BU] Votre document a été approuvé — {doc.titre}",
            message=(
                f"Bonjour {nom},\n\n"
                f"Votre document « {doc.titre} » a été approuvé et est maintenant "
                f"disponible dans la bibliothèque numérique du Daara Madjmahoun Noreyni UCAD.\n\n"
                f"Cordialement,\nLa Commission Pédagogique"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[destinataire.email],
            fail_silently=False,
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

    nom = destinataire.get_full_name() or destinataire.email
    motif = f"\n\nMotif : {doc.raison_rejet}" if doc.raison_rejet else ""
    try:
        send_mail(
            subject=f"[DMN BU] Votre document n'a pas été retenu — {doc.titre}",
            message=(
                f"Bonjour {nom},\n\n"
                f"Votre document « {doc.titre} » n'a malheureusement pas pu être retenu "
                f"dans la bibliothèque numérique.{motif}\n\n"
                f"Pour toute question, contactez la commission pédagogique.\n\n"
                f"Cordialement,\nLa Commission Pédagogique"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[destinataire.email],
            fail_silently=False,
        )
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)
