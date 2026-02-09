from django.db import migrations, models
import django.db.models.deletion
from django.core.validators import MinValueValidator


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
        ('property', '0008_tenant_has_ledger_account_tenant_ledger_account_and_more'),
        ('sales', '0004_receiptvoucher_lease_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='CustomerInvoice',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('invoice_number', models.CharField(blank=True, max_length=50, null=True, unique=True)),
                ('invoice_date', models.DateField()),
                ('due_date', models.DateField(blank=True, null=True)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=15, validators=[MinValueValidator(0)])),
                ('is_taxable', models.BooleanField(default=False)),
                ('tax_rate', models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ('tax_amount', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('total_amount', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('submitted', 'Submitted'), ('paid', 'Paid'), ('void', 'Void')], default='draft', max_length=20)),
                ('notes', models.TextField(blank=True)),
                ('accounting_posted', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('cost_center', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='customer_invoices', to='accounts.costcenter')),
                ('income_account', models.ForeignKey(limit_choices_to={'account_type': 'income'}, on_delete=django.db.models.deletion.PROTECT, related_name='customer_invoice_income', to='accounts.account')),
                ('lease', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='customer_invoices', to='property.lease')),
                ('tax_account', models.ForeignKey(blank=True, limit_choices_to={'account_type': 'liability'}, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='customer_invoice_tax', to='accounts.account')),
                ('tenant', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='customer_invoices', to='property.tenant')),
                ('tenant_account', models.ForeignKey(limit_choices_to={'account_type': 'asset'}, on_delete=django.db.models.deletion.PROTECT, related_name='customer_invoice_receivable', to='accounts.account')),
            ],
            options={
                'ordering': ['-invoice_date'],
                'verbose_name': 'Customer Invoice',
                'verbose_name_plural': 'Customer Invoices',
            },
        ),
    ]
