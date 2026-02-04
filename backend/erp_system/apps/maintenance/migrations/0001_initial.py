from django.db import migrations, models
import django.db.models.deletion
import django.core.validators


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('property', '0005_alter_leaserenewal_renewal_number_and_more'),
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='MaintenanceRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('request_type', models.CharField(choices=[('plumbing', 'Plumbing'), ('electrical', 'Electrical'), ('hvac', 'HVAC'), ('carpentry', 'Carpentry'), ('general', 'General'), ('other', 'Other')], max_length=30)),
                ('description', models.TextField()),
                ('priority', models.CharField(choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')], default='medium', max_length=20)),
                ('status', models.CharField(choices=[('open', 'Open'), ('in_progress', 'In Progress'), ('completed', 'Completed'), ('cancelled', 'Cancelled')], default='open', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('cost_center', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='maintenance_requests', to='accounts.costcenter')),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='maintenance_requests', to='auth.user')),
                ('property', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='maintenance_requests', to='property.property')),
                ('unit', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='maintenance_requests', to='property.unit')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='MaintenanceContract',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('start_date', models.DateField()),
                ('end_date', models.DateField()),
                ('total_amount', models.DecimalField(decimal_places=2, max_digits=15, validators=[django.core.validators.MinValueValidator(0)])),
                ('duration_months', models.PositiveIntegerField()),
                ('amortized_amount', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('active', 'Active'), ('completed', 'Completed')], default='draft', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('cost_center', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='maintenance_contracts', to='accounts.costcenter')),
                ('expense_account', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='maintenance_expense_contracts', to='accounts.account')),
                ('prepaid_account', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='maintenance_prepaid_contracts', to='accounts.account')),
                ('property', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='maintenance_contracts', to='property.property')),
                ('supplier', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='maintenance_contracts', to='property.tenant')),
                ('supplier_account', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='maintenance_supplier_contracts', to='accounts.account')),
                ('unit', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='maintenance_contracts', to='property.unit')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
