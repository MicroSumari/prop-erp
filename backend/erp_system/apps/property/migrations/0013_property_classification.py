from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_system_configuration'),
        ('property', '0012_tenant_ledger_account_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='property',
            name='classification',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='properties', to='accounts.propertyclassification'),
        ),
    ]
