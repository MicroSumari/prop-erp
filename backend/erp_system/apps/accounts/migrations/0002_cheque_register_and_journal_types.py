from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
        ('sales', '0004_receiptvoucher_lease_and_more'),
        ('purchase', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ChequeRegister',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('cheque_type', models.CharField(choices=[('incoming', 'Incoming'), ('outgoing', 'Outgoing')], max_length=20)),
                ('cheque_number', models.CharField(max_length=50)),
                ('cheque_date', models.DateField()),
                ('amount', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('bank_name', models.CharField(blank=True, max_length=200, null=True)),
                ('status', models.CharField(choices=[('received', 'Received'), ('deposited', 'Deposited'), ('cleared', 'Cleared'), ('bounced', 'Bounced'), ('cancelled', 'Cancelled')], default='received', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('bank_account', models.ForeignKey(blank=True, limit_choices_to={'account_type': 'asset'}, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='cheque_bank_registers', to='accounts.account')),
                ('cheques_issued_account', models.ForeignKey(blank=True, limit_choices_to={'account_type': 'liability'}, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='cheques_issued_registers', to='accounts.account')),
                ('cheques_received_account', models.ForeignKey(blank=True, limit_choices_to={'account_type': 'asset'}, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='cheques_received_registers', to='accounts.account')),
                ('cost_center', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='cheque_registers', to='accounts.costcenter')),
                ('payment_voucher', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='cheque_registers', to='purchase.paymentvoucher')),
                ('receipt_voucher', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='cheque_registers', to='sales.receiptvoucher')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
