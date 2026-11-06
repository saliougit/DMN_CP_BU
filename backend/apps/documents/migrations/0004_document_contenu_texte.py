from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0003_add_nb_consultations'),
    ]

    operations = [
        migrations.AddField(
            model_name='document',
            name='contenu_texte',
            field=models.TextField(blank=True, default=''),
        ),
    ]
