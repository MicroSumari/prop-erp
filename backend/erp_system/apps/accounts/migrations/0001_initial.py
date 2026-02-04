from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Account',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('account_number', models.CharField(max_length=50, unique=True)),
                ('account_name', models.CharField(max_length=200)),
                ('account_type', models.CharField(choices=[('asset', 'Asset'), ('liability', 'Liability'), ('equity', 'Equity'), ('income', 'Income'), ('expense', 'Expense')], max_length=20)),
                ('description', models.TextField(blank=True, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name='CostCenter',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(max_length=50, unique=True)),
                ('name', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name='JournalEntry',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('entry_type', models.CharField(choices=[('prepaid', 'Prepaid Recognition'), ('amortization', 'Amortization')], max_length=30)),
                ('entry_date', models.DateField(auto_now_add=True)),
                ('reference_type', models.CharField(max_length=100)),
                ('reference_id', models.PositiveIntegerField()),
                ('period', models.CharField(blank=True, default='', max_length=7)),
                ('description', models.CharField(blank=True, max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['-entry_date', '-id'],
                'unique_together': {('reference_type', 'reference_id', 'entry_type', 'period')},
            },
        ),
        migrations.CreateModel(
            name='JournalLine',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('debit', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('credit', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('reference_type', models.CharField(max_length=100)),
                ('reference_id', models.PositiveIntegerField()),
                ('account', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='journal_lines', to='accounts.account')),
                ('cost_center', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='journal_lines', to='accounts.costcenter')),
                ('journal_entry', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lines', to='accounts.journalentry')),
            ],
        ),
    ]
