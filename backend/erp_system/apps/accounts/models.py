from django.db import models


class CostCenter(models.Model):
    """Cost center for tracking unit/property costs"""
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.code} - {self.name}"


class Account(models.Model):
    """Account/Chart of Accounts model"""
    ACCOUNT_TYPE_CHOICES = [
        ('asset', 'Asset'),
        ('liability', 'Liability'),
        ('equity', 'Equity'),
        ('income', 'Income'),
        ('expense', 'Expense'),
    ]
    
    account_number = models.CharField(max_length=50, unique=True)
    account_name = models.CharField(max_length=200)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPE_CHOICES)
    description = models.TextField(blank=True, null=True)
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.account_number} - {self.account_name}"


class JournalEntry(models.Model):
    """Journal entry header"""
    ENTRY_TYPE_CHOICES = [
        ('prepaid', 'Prepaid Recognition'),
        ('amortization', 'Amortization'),
    ]

    entry_type = models.CharField(max_length=30, choices=ENTRY_TYPE_CHOICES)
    entry_date = models.DateField(auto_now_add=True)
    reference_type = models.CharField(max_length=100)
    reference_id = models.PositiveIntegerField()
    period = models.CharField(max_length=7, blank=True, default='')  # YYYY-MM
    description = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('reference_type', 'reference_id', 'entry_type', 'period')
        ordering = ['-entry_date', '-id']

    def __str__(self):
        return f"{self.entry_type} - {self.reference_type}:{self.reference_id}"


class JournalLine(models.Model):
    """Journal entry lines (double-entry)"""
    journal_entry = models.ForeignKey(JournalEntry, on_delete=models.CASCADE, related_name='lines')
    account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name='journal_lines')
    debit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    credit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    cost_center = models.ForeignKey(CostCenter, on_delete=models.PROTECT, related_name='journal_lines')
    reference_type = models.CharField(max_length=100)
    reference_id = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.journal_entry_id} - {self.account.account_number}"
