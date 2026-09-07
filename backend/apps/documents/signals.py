from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Document
from . import search


@receiver(post_save, sender=Document)
def on_document_save(sender, instance, created, **kwargs):
    if instance.statut == "approuve":
        search.index_document(instance)
        if not created:  # notification uniquement après approbation, pas à la création directe par un admin
            try:
                from .tasks import notifier_approbation
                notifier_approbation.delay(str(instance.id))
            except Exception:
                pass  # Celery/Redis non disponible (ex: manage.py shell, tests)
    elif instance.statut == "rejete":
        search.delete_from_index(instance.id)
        try:
            from .tasks import notifier_rejet
            notifier_rejet.delay(str(instance.id))
        except Exception:
            pass


@receiver(post_delete, sender=Document)
def on_document_delete(sender, instance, **kwargs):
    search.delete_from_index(instance.id)
