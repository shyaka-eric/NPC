from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0008_item_deletion_reason'),
    ]

    operations = [
        migrations.RenameField(
            model_name='repairrequest',
            old_name='description',
            new_name='reason',
        ),
    ]
