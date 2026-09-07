from rest_framework import serializers
from .models import Faculte, Filiere, Niveau


class NiveauSerializer(serializers.ModelSerializer):
    class Meta:
        model = Niveau
        fields = ["id", "nom", "ordre", "cycle"]


class FiliereSerializer(serializers.ModelSerializer):
    faculteId = serializers.UUIDField(source="faculte_id", read_only=True)

    class Meta:
        model = Filiere
        fields = ["id", "nom", "faculteId"]


class FaculteSerializer(serializers.ModelSerializer):
    filieres = FiliereSerializer(many=True, read_only=True)

    class Meta:
        model = Faculte
        fields = ["id", "nom", "code", "filieres"]
