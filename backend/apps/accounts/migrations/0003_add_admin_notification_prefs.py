from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_user_niveau'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='notify_approbation',
            field=models.BooleanField(default=True, help_text='Recevoir un email quand un document est approuvé'),
        ),
        migrations.AddField(
            model_name='user',
            name='notify_compte',
            field=models.BooleanField(default=True, help_text='Recevoir un email à chaque création de compte membre'),
        ),
        migrations.AddField(
            model_name='user',
            name='notify_rejet',
            field=models.BooleanField(default=True, help_text='Recevoir un email quand un document est rejeté'),
        ),
        migrations.AddField(
            model_name='user',
            name='notify_soumission',
            field=models.BooleanField(default=True, help_text='Recevoir un email à chaque nouvelle soumission de document'),
        ),
    ]
