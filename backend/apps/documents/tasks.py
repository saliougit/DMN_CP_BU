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
            subject=f"[DMN-BU] Votre document a été approuvé — {doc.titre}",
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
            subject=f"[DMN-BU] Décision de la Commission Pédagogique — {doc.titre}",
            template="emails/rejet.html",
            context={"doc": doc, "nom": nom},
            recipient=destinataire.email,
        )
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)
