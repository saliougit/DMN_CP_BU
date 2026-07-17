from rest_framework import serializers
from .models import Document


class DocumentListSerializer(serializers.ModelSerializer):
    faculte_nom = serializers.CharField(source="faculte.nom",   read_only=True)
    filiere_nom = serializers.CharField(source="filiere.nom",   read_only=True, allow_null=True)
    niveau_nom  = serializers.CharField(source="niveau.nom",    read_only=True)

    class Meta:
        model = Document
        fields = [
            "id", "titre", "auteur", "type", "statut",
            "faculte", "faculte_nom",
            "filiere", "filiere_nom",
            "niveau",  "niveau_nom",
            "annee", "resume", "mots_cles", "directeur", "pages",
            "date_soumission",
        ]


class DocumentDetailSerializer(DocumentListSerializer):
    class Meta(DocumentListSerializer.Meta):
        fields = DocumentListSerializer.Meta.fields + [
            "fichier", "approuve_par", "date_approbation", "raison_rejet",
        ]


class DocumentSoumissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = [
            "titre", "auteur", "type",
            "faculte", "filiere", "niveau", "annee",
            "resume", "mots_cles", "directeur", "pages", "fichier",
        ]
