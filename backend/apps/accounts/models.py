import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class RoleChoices(models.TextChoices):
    ADMIN  = "admin",  "Administrateur"
    MEMBRE = "membre", "Membre"


class User(AbstractUser):
    id    = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # AbstractUser.email n'est pas unique par défaut — or EmailBackend
    # authentifie par User.objects.get(email=...), qui plante (500) des
    # qu'un doublon existe.
    email = models.EmailField("email address", unique=True, blank=True)
    role  = models.CharField(max_length=10, choices=RoleChoices.choices, default=RoleChoices.MEMBRE)

    telephone     = models.CharField(max_length=20, blank=True)
    photo         = models.ImageField(upload_to="photos/", null=True, blank=True)
    bio           = models.TextField(blank=True)
    date_adhesion = models.DateField(null=True, blank=True)

    # Préférences de notification — uniquement pour les admins
    notify_soumission  = models.BooleanField(default=True, help_text="Recevoir un email à chaque nouvelle soumission de document")
    notify_compte      = models.BooleanField(default=True, help_text="Recevoir un email à chaque création de compte membre")
    notify_approbation = models.BooleanField(default=True, help_text="Recevoir un email quand un document est approuvé")
    notify_rejet       = models.BooleanField(default=True, help_text="Recevoir un email quand un document est rejeté")

    faculte = models.ForeignKey(
        "classification.Faculte",
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name="membres",
    )
    filiere = models.ForeignKey(
        "classification.Filiere",
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name="membres",
    )
    niveau = models.ForeignKey(
        "classification.Niveau",
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name="membres",
    )

    class Meta:
        db_table = "user"

    @property
    def is_admin_role(self):
        return self.role == RoleChoices.ADMIN

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"
