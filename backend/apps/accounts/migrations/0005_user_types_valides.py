import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_user_email_unique'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='types_valides',
            field=django.contrib.postgres.fields.ArrayField(
                base_field=models.CharField(max_length=20), blank=True, default=list,
                help_text='Types de documents que cet admin peut approuver/rejeter (vide = consultation uniquement). Sans effet si super admin.',
                size=None,
            ),
        ),
    ]
