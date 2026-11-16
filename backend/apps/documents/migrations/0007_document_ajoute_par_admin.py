from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0006_configuration'),
    ]

    operations = [
        migrations.AddField(
            model_name='document',
            name='ajoute_par_admin',
            field=models.BooleanField(default=False),
        ),
    ]
