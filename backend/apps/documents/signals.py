from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Document
from . import search


def _fire(task_name: str, *args):
    try:
        from . import tasks
        getattr(tasks, task_name).delay(*args)
    except Exception:
        pass  # Celery/Redis non disponible (ex: manage.py shell, tests)


@receiver(post_save, sender=Document)
def on_document_save(sender, instance, created, **kwargs):
    doc_id = str(instance.id)

    if created:
        _fire("calculer_pages", doc_id)
        if instance.statut == "en_attente":
            # Nouvelle soumission → notifier les admins
            _fire("notifier_admins_soumission", doc_id)

    elif not created:
        if instance.statut == "approuve":
            search.index_document(instance)
            _fire("notifier_approbation", doc_id)           # membre
            _fire("notifier_admins_approbation", doc_id)    # admins

        elif instance.statut == "rejete":
            search.delete_from_index(instance.id)
            _fire("notifier_rejet", doc_id)                 # membre
            _fire("notifier_admins_rejet", doc_id)          # admins


@receiver(post_delete, sender=Document)
def on_document_delete(sender, instance, **kwargs):
    search.delete_from_index(instance.id)
