from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Document
from . import search


@receiver(post_save, sender=Document)
def on_document_save(sender, instance, **kwargs):
    if instance.statut == "approuve":
        search.index_document(instance)
    elif instance.statut == "rejete":
        search.delete_from_index(instance.id)


@receiver(post_delete, sender=Document)
def on_document_delete(sender, instance, **kwargs):
    search.delete_from_index(instance.id)
