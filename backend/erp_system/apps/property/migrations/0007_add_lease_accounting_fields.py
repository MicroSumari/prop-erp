# Generated migration for adding accounting fields to Lease and LeaseTermination

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
        ('property', '0006_add_unit_cost_center'),
    ]

    operations = [
        migrations.AddField(
            model_name='lease',
            name='other_charges',
            field=models.DecimalField(blank=True, decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name='lease',
            name='cost_center',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='leases', to='accounts.costcenter'),
        ),
        migrations.AddField(
            model_name='lease',
            name='unearned_revenue_account',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='lease_unearned_revenue', to='accounts.account'),
        ),
        migrations.AddField(
            model_name='lease',
            name='refundable_deposit_account',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='lease_deposits', to='accounts.account'),
        ),
        migrations.AddField(
            model_name='lease',
            name='other_charges_account',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='lease_other_charges', to='accounts.account'),
        ),
        migrations.AddField(
            model_name='lease',
            name='accounting_posted',
            field=models.BooleanField(default=False, help_text='Whether accounting entry has been posted'),
        ),
        migrations.AddField(
            model_name='leasetermination',
            name='deposit_account',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='lease_termination_deposits', to='accounts.account'),
        ),
        migrations.AddField(
            model_name='leasetermination',
            name='unearned_revenue_account',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='lease_termination_unearned', to='accounts.account'),
        ),
        migrations.AddField(
            model_name='leasetermination',
            name='tenant_account',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='lease_termination_tenant', to='accounts.account'),
        ),
        migrations.AddField(
            model_name='leasetermination',
            name='maintenance_charges_account',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='lease_termination_maintenance', to='accounts.account'),
        ),
        migrations.AddField(
            model_name='leasetermination',
            name='post_dated_cheques_account',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='lease_termination_cheques', to='accounts.account'),
        ),
        migrations.AddField(
            model_name='leasetermination',
            name='penalty_account',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='lease_termination_penalties', to='accounts.account'),
        ),
        migrations.AddField(
            model_name='leasetermination',
            name='accounting_posted',
            field=models.BooleanField(default=False, help_text='Whether accounting entries have been posted'),
        ),
    ]
