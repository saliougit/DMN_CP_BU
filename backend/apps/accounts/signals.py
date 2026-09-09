from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User


@receiver(post_save, sender=User)
def on_user_created(sender, instance, created, **kwargs):
    if created and instance.role == "membre":
        try:
            from apps.documents.tasks import notifier_admins_compte
            notifier_admins_compte.delay(str(instance.id))
        except Exception:
            pass
