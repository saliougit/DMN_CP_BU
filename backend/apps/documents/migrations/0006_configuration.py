from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0005_document_fichier_pdf_only'),
    ]

    operations = [
        migrations.CreateModel(
            name='Configuration',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('afficher_boutons_documents_rejetes', models.BooleanField(
                    default=False,
                    help_text=(
                        "Afficher les boutons Approuver/Rejeter sur un document déjà "
                        "rejeté (permet à un admin habilité de revenir sur une décision "
                        "sans repasser par une nouvelle soumission). Désactivé par défaut."
                    ),
                )),
            ],
            options={
                'verbose_name': 'Configuration',
                'verbose_name_plural': 'Configuration',
            },
        ),
    ]
