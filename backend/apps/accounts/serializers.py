from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    faculte_nom = serializers.CharField(source="faculte.nom", allow_null=True, read_only=True)
    filiere_nom = serializers.CharField(source="filiere.nom", allow_null=True, read_only=True)
    niveau_nom  = serializers.CharField(source="niveau.nom",  allow_null=True, read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "role", "telephone",
            "faculte", "filiere", "niveau",
            "faculte_nom", "filiere_nom", "niveau_nom",
            "date_adhesion", "photo", "date_joined",
        ]
        read_only_fields = ["id", "role", "date_joined"]


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
