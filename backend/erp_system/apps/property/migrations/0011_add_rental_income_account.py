from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
        ('property', '0010_rentallegalcase_alter_unit_status_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='lease',
            name='rental_income_account',
            field=models.ForeignKey(blank=True, limit_choices_to={'account_type': 'income'}, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='lease_rental_income', to='accounts.account'),
        ),
    ]
