from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
        ('property', '0005_alter_leaserenewal_renewal_number_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='unit',
            name='cost_center',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='units', to='accounts.costcenter'),
        ),
    ]
