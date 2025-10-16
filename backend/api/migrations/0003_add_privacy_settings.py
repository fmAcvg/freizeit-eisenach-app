# Generated manually for privacy settings

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_eventcomment_eventlike_friendship_notification_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='profile_public',
            field=models.BooleanField(default=True, help_text='Profil öffentlich sichtbar'),
        ),
        migrations.AddField(
            model_name='profile',
            name='events_public',
            field=models.BooleanField(default=True, help_text='Event-Teilnahme öffentlich sichtbar'),
        ),
    ]
