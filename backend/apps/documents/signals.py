import logging

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Document

logger = logging.getLogger(__name__)


def _fire(task_name: str, *args):
    try:
        from . import tasks
        getattr(tasks, task_name).delay(*args)
    except Exception:
        # Celery/Redis non disponible (ex: manage.py shell, tests) — ne doit
        # jamais faire planter la requete, mais ne doit pas non plus
        # disparaitre sans trace (voir incident redis-py/kombu non detecte).
        logger.exception("Echec de mise en file de la tache Celery '%s'", task_name)


@receiver(post_save, sender=Document)
def on_document_save(sender, instance, created, **kwargs):
    doc_id = str(instance.id)

    if created:
        _fire("traiter_pdf", doc_id)
        if instance.statut == "en_attente":
            # Nouvelle soumission → notifier les admins
            _fire("notifier_admins_soumission", doc_id)

    elif not created:
        if instance.statut == "approuve":
            _fire("indexer_document", doc_id)
            _fire("notifier_approbation", doc_id)           # membre
            _fire("notifier_admins_approbation", doc_id)    # admins

        elif instance.statut == "rejete":
            _fire("desindexer_document", doc_id)
            _fire("notifier_rejet", doc_id)                 # membre
            _fire("notifier_admins_rejet", doc_id)          # admins


@receiver(post_delete, sender=Document)
def on_document_delete(sender, instance, **kwargs):
    _fire("desindexer_document", str(instance.id))
