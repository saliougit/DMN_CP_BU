import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class RoleChoices(models.TextChoices):
    ADMIN  = "admin",  "Administrateur"
    MEMBRE = "membre", "Membre"


class User(AbstractUser):
    id   = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=10, choices=RoleChoices.choices, default=RoleChoices.MEMBRE)

    telephone     = models.CharField(max_length=20, blank=True)
    photo         = models.ImageField(upload_to="photos/", null=True, blank=True)
    bio           = models.TextField(blank=True)
    date_adhesion = models.DateField(null=True, blank=True)

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

    class Meta:
        db_table = "user"

    @property
    def is_admin_role(self):
        return self.role == RoleChoices.ADMIN

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"
