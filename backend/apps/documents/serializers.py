from rest_framework import serializers
from .models import Document
from .storage_utils import presigned_file_url

# PDF uniquement : le FileField n'a aucune contrainte de type, donc sans ce
# contrôle n'importe quel fichier (html, svg, exécutable...) pourrait être
# soumis comme "document" et fini par être servi tel quel depuis le stockage.
FICHIER_EXTENSIONS_AUTORISEES = (".pdf",)
FICHIER_TAILLE_MAX = 50 * 1024 * 1024  # 50 Mo


class DocumentListSerializer(serializers.ModelSerializer):
    faculte_nom = serializers.CharField(source="faculte.nom",   read_only=True)
    filiere_nom = serializers.CharField(source="filiere.nom",   read_only=True, allow_null=True)
    niveau_nom  = serializers.CharField(source="niveau.nom",    read_only=True)
    soumis_par_nom = serializers.SerializerMethodField(read_only=True)
    fichier = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Document
        fields = [
            "id", "titre", "auteur", "type", "statut",
            "faculte", "faculte_nom",
            "filiere", "filiere_nom",
            "niveau",  "niveau_nom",
            "annee", "resume", "mots_cles", "directeur", "pages",
            "fichier", "date_soumission", "date_approbation", "date_rejet",
            "raison_rejet", "soumis_par", "soumis_par_nom",
            "nb_telechargements", "nb_consultations",
        ]

    def get_soumis_par_nom(self, obj):
        if obj.soumis_par:
            return f"{obj.soumis_par.first_name} {obj.soumis_par.last_name}".strip() or obj.soumis_par.username
        return None

    def get_fichier(self, obj):
        # Bucket privé : jamais l'URL publique brute, toujours signée et à
        # durée limitée (voir storage_utils.presigned_file_url).
        if not obj.fichier:
            return None
        return presigned_file_url(obj.fichier.name)


class DocumentDetailSerializer(DocumentListSerializer):
    class Meta(DocumentListSerializer.Meta):
        fields = DocumentListSerializer.Meta.fields + [
            "approuve_par", "date_approbation", "raison_rejet",
        ]


class DocumentSoumissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = [
            "titre", "auteur", "type",
            "faculte", "filiere", "niveau", "annee",
            "resume", "mots_cles", "directeur", "pages", "fichier",
        ]

    def validate_fichier(self, value):
        nom = value.name.lower()
        if not nom.endswith(FICHIER_EXTENSIONS_AUTORISEES):
            raise serializers.ValidationError("Seuls les fichiers PDF sont acceptés.")
        if value.size > FICHIER_TAILLE_MAX:
            raise serializers.ValidationError("Le fichier dépasse la taille maximale autorisée (50 Mo).")
        entete = value.read(5)
        value.seek(0)
        if entete != b"%PDF-":
            raise serializers.ValidationError("Le fichier ne semble pas être un PDF valide.")
        return value
