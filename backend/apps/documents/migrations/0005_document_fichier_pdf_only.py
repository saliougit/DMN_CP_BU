import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0004_document_contenu_texte'),
    ]

    operations = [
        migrations.AlterField(
            model_name='document',
            name='fichier',
            field=models.FileField(
                blank=True, null=True, upload_to='documents/',
                validators=[django.core.validators.FileExtensionValidator(['pdf'])],
            ),
        ),
    ]
