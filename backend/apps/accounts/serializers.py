from rest_framework import serializers
from .models import User

# Photo de profil : même logique que les documents (bucket privé — voir
# apps/documents/storage_utils.py) et même esprit de validation que les PDF
# (apps/documents/serializers.py) pour éviter un upload non contrôlé.
PHOTO_EXTENSIONS_AUTORISEES = (".jpg", ".jpeg", ".png", ".webp")
PHOTO_TAILLE_MAX = 5 * 1024 * 1024  # 5 Mo


class UserSerializer(serializers.ModelSerializer):
    faculte_nom = serializers.CharField(source="faculte.nom", allow_null=True, read_only=True)
    filiere_nom = serializers.CharField(source="filiere.nom", allow_null=True, read_only=True)
    niveau_nom  = serializers.CharField(source="niveau.nom",  allow_null=True, read_only=True)
    photo_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "role", "telephone", "is_superuser", "types_valides",
            "faculte", "filiere", "niveau",
            "faculte_nom", "filiere_nom", "niveau_nom",
            "date_adhesion", "photo", "photo_url", "date_joined",
        ]
        # role et types_valides ne se changent que par les endpoints dédiés
        # (AdminSetRoleView / AdminSetValidationPermissionsView) — jamais via
        # un PATCH générique, pour garder une seule porte d'entrée contrôlée.
        read_only_fields = ["id", "role", "is_superuser", "types_valides", "date_joined"]
        extra_kwargs = {
            # Meme raison que RegisterSerializer : eviter le message generique
            # DRF sur le champ email unique.
            "email": {"validators": []},
            # write_only : jamais renvoyé tel quel (bucket privé, voir photo_url
            # ci-dessous) ; allow_null pour permettre de retirer sa photo.
            "photo": {"write_only": True, "required": False, "allow_null": True},
        }

    def get_photo_url(self, obj):
        if not obj.photo:
            return None
        from apps.documents.storage_utils import presigned_file_url
        return presigned_file_url(obj.photo.name)

    def validate_photo(self, value):
        if value is None:
            return value
        nom = value.name.lower()
        if not nom.endswith(PHOTO_EXTENSIONS_AUTORISEES):
            raise serializers.ValidationError("Formats acceptés : JPG, PNG, WEBP.")
        if value.size > PHOTO_TAILLE_MAX:
            raise serializers.ValidationError("L'image dépasse la taille maximale autorisée (5 Mo).")
        return value


class RegisterSerializer(serializers.ModelSerializer):
    password         = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "username", "email", "first_name", "last_name",
            "password", "password_confirm", "telephone",
            "faculte", "filiere", "niveau",
        ]
        extra_kwargs = {
            "faculte": {"required": False, "allow_null": True},
            "filiere": {"required": False, "allow_null": True},
            "niveau":  {"required": False, "allow_null": True},
            # email.unique=True sur le modele fait que DRF attache
            # automatiquement son propre UniqueValidator generique ("Un objet
            # user avec ce champ email address existe deja.") qui s'execute
            # AVANT validate() ci-dessous et ecrase son message propre -
            # desactive au profit de la verification deja faite plus bas.
            "email": {"validators": []},
        }

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password_confirm"):
            raise serializers.ValidationError({"password_confirm": "Les mots de passe ne correspondent pas."})
        if User.objects.filter(email=attrs.get("email", "")).exists():
            raise serializers.ValidationError({"email": "Un compte avec cette adresse e-mail existe déjà."})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
