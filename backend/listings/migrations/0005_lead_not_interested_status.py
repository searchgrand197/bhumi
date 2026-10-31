# Generated manually for lead board buckets

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('listings', '0004_alter_lead_options_lead_called_at_lead_notes_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='lead',
            name='status',
            field=models.CharField(
                choices=[
                    ('new', 'To call'),
                    ('called', 'Call done'),
                    ('interested', 'Interested'),
                    ('not_interested', 'Not interested'),
                ],
                default='new',
                max_length=16,
            ),
        ),
    ]
