import uuid
from django.db import models


class Faculte(models.Model):
    id   = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom  = models.CharField(max_length=200, unique=True)
    code = models.CharField(max_length=20, unique=True)

    class Meta:
        db_table = "faculte"
        ordering = ["nom"]

    def __str__(self):
        return f"{self.code} — {self.nom}"


class Filiere(models.Model):
    id      = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom     = models.CharField(max_length=200)
    faculte = models.ForeignKey(Faculte, on_delete=models.CASCADE, related_name="filieres")

    class Meta:
        db_table = "filiere"
        unique_together = ("nom", "faculte")
        ordering = ["nom"]

    def __str__(self):
        return f"{self.nom} ({self.faculte.code})"


class CycleChoices(models.TextChoices):
    LMD = "LMD", "Système LMD"
    ING = "ING", "Cycle Ingénieur"


class Niveau(models.Model):
    id    = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom   = models.CharField(max_length=50, unique=True)
    ordre = models.PositiveSmallIntegerField()
    cycle = models.CharField(max_length=3, choices=CycleChoices.choices, default=CycleChoices.LMD)

    class Meta:
        db_table = "niveau"
        ordering = ["ordre"]

    def __str__(self):
        return self.nom
