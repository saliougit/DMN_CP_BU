from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0002_add_date_rejet_nb_telechargements'),
    ]

    operations = [
        migrations.AddField(
            model_name='document',
            name='nb_consultations',
            field=models.PositiveIntegerField(default=0),
        ),
    ]
