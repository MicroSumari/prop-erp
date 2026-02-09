from django.db import migrations, models
import django.db.models.deletion
from django.core.validators import MinValueValidator


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('accounts', '0001_initial'),
        ('property', '0008_tenant_has_ledger_account_tenant_ledger_account_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='PurchaseOrder',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('po_number', models.CharField(max_length=50, unique=True)),
                ('vendor', models.CharField(max_length=200)),
                ('po_date', models.DateField()),
                ('expected_delivery_date', models.DateField()),
                ('total_amount', models.DecimalField(decimal_places=2, max_digits=15)),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('submitted', 'Submitted'), ('received', 'Received'), ('completed', 'Completed'), ('cancelled', 'Cancelled')], default='draft', max_length=20)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name='SupplierInvoice',
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
                ('cost_center', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='supplier_invoices', to='accounts.costcenter')),
                ('expense_account', models.ForeignKey(limit_choices_to={'account_type': 'expense'}, on_delete=django.db.models.deletion.PROTECT, related_name='supplier_invoice_expenses', to='accounts.account')),
                ('supplier', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='supplier_invoices', to='property.tenant')),
                ('supplier_account', models.ForeignKey(limit_choices_to={'account_type': 'liability'}, on_delete=django.db.models.deletion.PROTECT, related_name='supplier_invoice_payables', to='accounts.account')),
                ('tax_account', models.ForeignKey(blank=True, limit_choices_to={'account_type': 'liability'}, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='supplier_invoice_taxes', to='accounts.account')),
            ],
            options={
                'ordering': ['-invoice_date'],
            },
        ),
        migrations.CreateModel(
            name='PaymentVoucher',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('voucher_number', models.CharField(blank=True, max_length=50, null=True, unique=True)),
                ('payment_date', models.DateField()),
                ('amount', models.DecimalField(decimal_places=2, max_digits=15, validators=[MinValueValidator(0)])),
                ('payment_method', models.CharField(choices=[('cash', 'Cash'), ('bank', 'Bank Transfer'), ('cheque', 'Cheque')], max_length=20)),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('submitted', 'Submitted'), ('cleared', 'Cleared'), ('cancelled', 'Cancelled')], default='draft', max_length=20)),
                ('description', models.TextField(blank=True)),
                ('notes', models.TextField(blank=True)),
                ('accounting_posted', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('bank_account', models.ForeignKey(blank=True, limit_choices_to={'account_type': 'asset'}, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='payment_bank', to='accounts.account')),
                ('cash_account', models.ForeignKey(blank=True, limit_choices_to={'account_type': 'asset'}, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='payment_cash', to='accounts.account')),
                ('cheques_issued_account', models.ForeignKey(blank=True, limit_choices_to={'account_type': 'liability'}, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='payment_cheques_issued', to='accounts.account')),
                ('cost_center', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='payment_vouchers', to='accounts.costcenter')),
                ('supplier', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='payment_vouchers', to='property.tenant')),
                ('supplier_account', models.ForeignKey(limit_choices_to={'account_type': 'liability'}, on_delete=django.db.models.deletion.PROTECT, related_name='payment_supplier', to='accounts.account')),
                ('supplier_invoice', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='payment_vouchers', to='purchase.supplierinvoice')),
            ],
            options={
                'ordering': ['-payment_date'],
            },
        ),
    ]
