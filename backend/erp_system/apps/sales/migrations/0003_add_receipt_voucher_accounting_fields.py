# Generated migration for adding accounting fields to ReceiptVoucher

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
        ('sales', '0002_alter_receiptvoucher_receipt_number'),
    ]

    operations = [
        migrations.AddField(
            model_name='receiptvoucher',
            name='cash_account',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='receipt_cash', to='accounts.account'),
        ),
        migrations.AddField(
            model_name='receiptvoucher',
            name='bank_account',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='receipt_bank', to='accounts.account'),
        ),
        migrations.AddField(
            model_name='receiptvoucher',
            name='post_dated_cheques_account',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='receipt_post_dated', to='accounts.account'),
        ),
        migrations.AddField(
            model_name='receiptvoucher',
            name='tenant_account',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='receipt_tenant', to='accounts.account'),
        ),
        migrations.AddField(
            model_name='receiptvoucher',
            name='cost_center',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='receipt_vouchers', to='accounts.costcenter'),
        ),
        migrations.AddField(
            model_name='receiptvoucher',
            name='accounting_posted',
            field=models.BooleanField(default=False, help_text='Whether accounting entry has been posted'),
        ),
    ]
