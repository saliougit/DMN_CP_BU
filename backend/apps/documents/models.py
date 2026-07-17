import uuid
from django.db import models
from django.contrib.postgres.fields import ArrayField


class TypeDocument(models.TextChoices):
    MEMOIRE_LICENCE = "memoire_licence", "Mémoire de Licence"
    MEMOIRE_MASTER  = "memoire_master",  "Mémoire de Master"
    THESE_DOCTORAT  = "these_doctorat",  "Thèse de Doctorat"
    ARTICLE         = "article",         "Article de recherche"
    RAPPORT         = "rapport",         "Rapport de stage"


class StatutDocument(models.TextChoices):
    EN_ATTENTE = "en_attente", "En attente"
    APPROUVE   = "approuve",   "Approuvé"
    REJETE     = "rejete",     "Rejeté"


class Document(models.Model):
    id     = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    titre  = models.CharField(max_length=500)
    auteur = models.CharField(max_length=200)
    type   = models.CharField(max_length=20, choices=TypeDocument.choices)
    statut = models.CharField(max_length=15, choices=StatutDocument.choices, default=StatutDocument.EN_ATTENTE)

    faculte = models.ForeignKey(
        "classification.Faculte",
        on_delete=models.PROTECT, related_name="documents",
    )
    filiere = models.ForeignKey(
        "classification.Filiere",
        on_delete=models.PROTECT, null=True, blank=True, related_name="documents",
    )
    niveau = models.ForeignKey(
        "classification.Niveau",
        on_delete=models.PROTECT, related_name="documents",
    )
    annee = models.PositiveSmallIntegerField()

    resume    = models.TextField(blank=True)
    mots_cles = ArrayField(models.CharField(max_length=100), default=list, blank=True)
    directeur = models.CharField(max_length=200, blank=True)
    pages     = models.PositiveSmallIntegerField(null=True, blank=True)
    fichier   = models.FileField(upload_to="documents/", null=True, blank=True)

    soumis_par = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL, null=True, blank=True, related_name="soumissions",
    )
    approuve_par = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL, null=True, blank=True, related_name="approbations",
    )
    raison_rejet = models.TextField(blank=True)

    date_soumission   = models.DateTimeField(auto_now_add=True)
    date_approbation  = models.DateTimeField(null=True, blank=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "document"
        ordering = ["-date_soumission"]
        indexes = [
            models.Index(fields=["statut"]),
            models.Index(fields=["faculte", "filiere", "niveau"]),
            models.Index(fields=["annee"]),
            models.Index(fields=["type"]),
        ]

    def __str__(self):
        return f"{self.titre} — {self.auteur} ({self.annee})"
