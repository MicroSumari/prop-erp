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


class TransactionAccountMapping(models.Model):
    """Maps transaction types to default accounts"""
    TRANSACTION_TYPE_CHOICES = [
        ('lease_creation', 'Lease Creation'),
        ('receipt_voucher', 'Receipt Voucher'),
        ('customer_invoice', 'Customer Invoice'),
        ('supplier_invoice', 'Supplier Invoice'),
        ('payment_voucher', 'Payment Voucher'),
        ('revenue_recognition', 'Revenue Recognition'),
        ('maintenance_request', 'Maintenance Request'),
    ]

    transaction_type = models.CharField(max_length=50, choices=TRANSACTION_TYPE_CHOICES, unique=True)
    debit_account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name='tx_map_debit')
    credit_account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name='tx_map_credit')
    cost_center = models.ForeignKey(CostCenter, on_delete=models.SET_NULL, null=True, blank=True)
    tax_account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name='tx_map_tax', null=True, blank=True)
    bank_account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name='tx_map_bank', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.transaction_type} mapping"


class PropertyClassification(models.Model):
    """Property classification with default accounting setup"""
    name = models.CharField(max_length=100, unique=True)
    default_revenue_account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name='property_revenue_defaults')
    default_expense_account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name='property_expense_defaults')
    default_cost_center = models.ForeignKey(CostCenter, on_delete=models.SET_NULL, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class ReceiptPaymentMapping(models.Model):
    """Receipt/Payment classification mapping"""
    MAPPING_TYPE_CHOICES = [
        ('receipt', 'Receipt'),
        ('payment', 'Payment'),
    ]

    name = models.CharField(max_length=100)
    mapping_type = models.CharField(max_length=20, choices=MAPPING_TYPE_CHOICES)
    debit_account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name='rp_map_debit')
    credit_account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name='rp_map_credit')
    tax_account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name='rp_map_tax', null=True, blank=True)
    bank_account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name='rp_map_bank', null=True, blank=True)
    is_taxable = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('name', 'mapping_type')

    def __str__(self):
        return f"{self.mapping_type}: {self.name}"


class JournalEntry(models.Model):
    """Journal entry header"""
    ENTRY_TYPE_CHOICES = [
        ('prepaid', 'Prepaid Recognition'),
        ('amortization', 'Amortization'),
        ('receipt', 'Receipt Voucher'),
        ('invoice', 'Invoice Posting'),
        ('payment', 'Payment Voucher'),
        ('revenue_recognition', 'Revenue Recognition'),
        ('cheque', 'Cheque Movement'),
        ('manual', 'Manual Journal Entry'),
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


class ChequeRegister(models.Model):
    """Cheque register for incoming and outgoing cheques"""
    CHEQUE_TYPE_CHOICES = [
        ('incoming', 'Incoming'),
        ('outgoing', 'Outgoing'),
    ]
    STATUS_CHOICES = [
        ('received', 'Received'),
        ('deposited', 'Deposited'),
        ('cleared', 'Cleared'),
        ('bounced', 'Bounced'),
        ('cancelled', 'Cancelled'),
    ]

    cheque_type = models.CharField(max_length=20, choices=CHEQUE_TYPE_CHOICES)
    cheque_number = models.CharField(max_length=50)
    cheque_date = models.DateField()
    amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    bank_name = models.CharField(max_length=200, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='received')

    receipt_voucher = models.ForeignKey(
        'sales.ReceiptVoucher',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cheque_registers'
    )
    payment_voucher = models.ForeignKey(
        'purchase.PaymentVoucher',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cheque_registers'
    )

    cheques_received_account = models.ForeignKey(
        Account,
        on_delete=models.PROTECT,
        related_name='cheques_received_registers',
        limit_choices_to={'account_type': 'asset'},
        null=True,
        blank=True
    )
    cheques_issued_account = models.ForeignKey(
        Account,
        on_delete=models.PROTECT,
        related_name='cheques_issued_registers',
        limit_choices_to={'account_type': 'liability'},
        null=True,
        blank=True
    )
    bank_account = models.ForeignKey(
        Account,
        on_delete=models.PROTECT,
        related_name='cheque_bank_registers',
        limit_choices_to={'account_type': 'asset'},
        null=True,
        blank=True
    )
    cost_center = models.ForeignKey(
        CostCenter,
        on_delete=models.PROTECT,
        related_name='cheque_registers',
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.cheque_type} cheque {self.cheque_number} - {self.status}"
