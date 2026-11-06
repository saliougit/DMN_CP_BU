"""
Commande : python manage.py backfill_contenu_texte

Rattrape l'extraction de texte PDF (voir tasks.traiter_pdf) pour les
documents deja existants avant l'ajout du champ contenu_texte - necessaire
pour que la recherche beneficie du contenu reel des PDF sur tout le
catalogue, pas seulement sur les futures soumissions.
"""
from django.core.management.base import BaseCommand
from apps.documents.models import Document
from apps.documents import tasks


class Command(BaseCommand):
    help = "Extrait le texte des PDF deja soumis (rattrapage pour la recherche)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--sync", action="store_true",
            help="Executer immediatement (sans Celery) - pratique sans worker actif.",
        )

    def handle(self, *args, **options):
        qs = Document.objects.exclude(fichier="").filter(contenu_texte="")
        total = qs.count()
        if total == 0:
            self.stdout.write(self.style.SUCCESS("Rien a rattraper — tous les documents ont deja leur contenu_texte."))
            return

        self.stdout.write(f"{total} document(s) à traiter…")
        for i, doc in enumerate(qs.iterator(), start=1):
            if options["sync"]:
                tasks.traiter_pdf.run(str(doc.id))
            else:
                tasks.traiter_pdf.delay(str(doc.id))
            self.stdout.write(f"  [{i}/{total}] {doc.titre[:60]}")

        self.stdout.write(self.style.SUCCESS(
            f"✓ {total} document(s) {'traités' if options['sync'] else 'mis en file Celery'}."
        ))
