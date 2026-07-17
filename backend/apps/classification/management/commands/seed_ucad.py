"""
Commande : python manage.py seed_ucad

Pré-charge la structure officielle de l'UCAD :
  8 facultés → filières → 11 niveaux (LMD + Cycle Ingénieur ESP)

La commande est idempotente : elle ne duplique pas les données
si elle est exécutée plusieurs fois (get_or_create).
"""

from django.core.management.base import BaseCommand
from apps.classification.models import Faculte, Filiere, Niveau, CycleChoices

UCAD_STRUCTURE = [
    {
        "nom": "Sciences et Techniques",
        "code": "FST",
        "filieres": ["PCSM", "BCGS", "MPI"],
    },
    {
        "nom": "École Supérieure Polytechnique",
        "code": "ESP",
        "filieres": [
            "Génie Mécanique",
            "Génie Électrique",
            "Génie Civil",
            "Génie Informatique",
            "Génie Chimique et Biologie Appliquée",
            "Gestion",
        ],
    },
    {
        "nom": "Médecine, Pharmacie et Odontologie",
        "code": "MÉDECINE",
        "filieres": ["Médecine", "Pharmacie", "Odontologie"],
    },
    {
        "nom": "Sciences Juridiques et Politiques",
        "code": "DROIT",
        "filieres": ["Science Politique", "Droit Public", "Droit Privé", "Histoire du Droit"],
    },
    {
        "nom": "Sciences Économiques et de Gestion",
        "code": "FASEG",
        "filieres": [
            "Analyses et Politiques Économiques",
            "Gestion",
            "Techniques Quantitatives",
        ],
    },
    {
        "nom": "Sciences de l'Éducation",
        "code": "FASTEF",
        "filieres": [],
    },
    {
        "nom": "Lettres et Sciences Humaines",
        "code": "FLSH",
        "filieres": [
            "Histoire", "Géographie", "Philosophie", "Sociologie",
            "Psychologie", "Linguistique", "Lettres Modernes",
            "Langues Romanes", "Anglais", "Russe", "Allemand",
            "Portugais", "Arabe",
        ],
    },
    {
        "nom": "Bibliothéconomie et Sciences de l'Information",
        "code": "EBAD",
        "filieres": [],
    },
]

NIVEAUX = [
    # Cycle LMD (toutes facultés)
    {"nom": "Licence 1", "ordre": 1,  "cycle": CycleChoices.LMD},
    {"nom": "Licence 2", "ordre": 2,  "cycle": CycleChoices.LMD},
    {"nom": "Licence 3", "ordre": 3,  "cycle": CycleChoices.LMD},
    {"nom": "Master 1",  "ordre": 4,  "cycle": CycleChoices.LMD},
    {"nom": "Master 2",  "ordre": 5,  "cycle": CycleChoices.LMD},
    {"nom": "Doctorat",  "ordre": 6,  "cycle": CycleChoices.LMD},
    # Cycle Ingénieur ESP (DUT → DIC)
    {"nom": "DUT 1", "ordre": 7,  "cycle": CycleChoices.ING},
    {"nom": "DUT 2", "ordre": 8,  "cycle": CycleChoices.ING},
    {"nom": "DIC 1", "ordre": 9,  "cycle": CycleChoices.ING},
    {"nom": "DIC 2", "ordre": 10, "cycle": CycleChoices.ING},
    {"nom": "DIC 3", "ordre": 11, "cycle": CycleChoices.ING},
]


class Command(BaseCommand):
    help = "Pré-charge la structure UCAD (facultés, filières, niveaux)"

    def handle(self, *args, **options):
        self.stdout.write("── Niveaux ──────────────────────────────")
        for data in NIVEAUX:
            obj, created = Niveau.objects.get_or_create(nom=data["nom"], defaults=data)
            status = "créé" if created else "existant"
            self.stdout.write(f"  {obj.nom} ({obj.cycle}) → {status}")

        self.stdout.write("\n── Facultés & Filières ──────────────────")
        for fac_data in UCAD_STRUCTURE:
            faculte, created = Faculte.objects.get_or_create(
                code=fac_data["code"],
                defaults={"nom": fac_data["nom"]},
            )
            status = "créée" if created else "existante"
            self.stdout.write(f"\n  [{faculte.code}] {faculte.nom} → {status}")

            for fi_nom in fac_data["filieres"]:
                fi, fi_created = Filiere.objects.get_or_create(nom=fi_nom, faculte=faculte)
                fi_status = "créée" if fi_created else "existante"
                self.stdout.write(f"    • {fi.nom} → {fi_status}")

        self.stdout.write(self.style.SUCCESS("\n✓ Seed UCAD terminé."))
