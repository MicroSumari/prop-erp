from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('property', '0011_add_rental_income_account'),
    ]

    operations = [
        migrations.AlterField(
            model_name='tenant',
            name='ledger_account',
            field=models.ForeignKey(blank=True, help_text='Customer/Supplier account in chart of accounts', limit_choices_to={'account_type__in': ['asset', 'liability']}, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='tenant_ledgers', to='accounts.account'),
        ),
    ]
