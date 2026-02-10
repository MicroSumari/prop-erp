from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_cheque_register_and_journal_types'),
    ]

    operations = [
        migrations.CreateModel(
            name='TransactionAccountMapping',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('transaction_type', models.CharField(choices=[('lease_creation', 'Lease Creation'), ('receipt_voucher', 'Receipt Voucher'), ('customer_invoice', 'Customer Invoice'), ('supplier_invoice', 'Supplier Invoice'), ('payment_voucher', 'Payment Voucher'), ('revenue_recognition', 'Revenue Recognition'), ('maintenance_request', 'Maintenance Request')], max_length=50, unique=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('bank_account', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='tx_map_bank', to='accounts.account')),
                ('cost_center', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='accounts.costcenter')),
                ('credit_account', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='tx_map_credit', to='accounts.account')),
                ('debit_account', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='tx_map_debit', to='accounts.account')),
                ('tax_account', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='tx_map_tax', to='accounts.account')),
            ],
        ),
        migrations.CreateModel(
            name='PropertyClassification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('default_cost_center', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='accounts.costcenter')),
                ('default_expense_account', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='property_expense_defaults', to='accounts.account')),
                ('default_revenue_account', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='property_revenue_defaults', to='accounts.account')),
            ],
        ),
        migrations.CreateModel(
            name='ReceiptPaymentMapping',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('mapping_type', models.CharField(choices=[('receipt', 'Receipt'), ('payment', 'Payment')], max_length=20)),
                ('is_taxable', models.BooleanField(default=False)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('bank_account', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='rp_map_bank', to='accounts.account')),
                ('credit_account', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='rp_map_credit', to='accounts.account')),
                ('debit_account', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='rp_map_debit', to='accounts.account')),
                ('tax_account', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='rp_map_tax', to='accounts.account')),
            ],
            options={
                'unique_together': {('name', 'mapping_type')},
            },
        ),
    ]
