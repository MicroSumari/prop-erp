from django.db import models
from django.core.validators import MinValueValidator
from erp_system.apps.property.models import Tenant
from erp_system.apps.accounts.models import Account, CostCenter


class SalesOrder(models.Model):
    """Sales Order model"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]
    
    so_number = models.CharField(max_length=50, unique=True)
    customer = models.CharField(max_length=200)
    
    order_date = models.DateField()
    delivery_date = models.DateField()
    
    total_amount = models.DecimalField(max_digits=15, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"SO-{self.so_number}"


class ReceiptVoucher(models.Model):
    """Receipt Voucher for tenant payments"""
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('bank', 'Bank Transfer'),
        ('cheque', 'Cheque'),
        ('post_dated_cheque', 'Post-Dated Cheque'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('cleared', 'Cleared'),
        ('bounced', 'Bounced'),
        ('cancelled', 'Cancelled'),
    ]
    
    # Receipt Details
    receipt_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='receipt_vouchers')
    lease = models.ForeignKey(
        'property.Lease',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='receipt_vouchers',
        help_text="Associated lease for this payment"
    )
    
    # Payment Information
    payment_date = models.DateField()
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    
    # Bank/Cheque Details (if applicable)
    bank_name = models.CharField(max_length=200, blank=True, null=True)
    cheque_number = models.CharField(max_length=50, blank=True, null=True)
    cheque_date = models.DateField(blank=True, null=True)  # For post-dated cheques
    
    # Status and Tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # For bank/cheque clearing
    cleared_date = models.DateField(blank=True, null=True)
    
    # Description/Notes
    description = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    
    # Accounting Fields
    cash_account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True, related_name='receipt_cash', limit_choices_to={'account_type': 'asset'})
    bank_account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True, related_name='receipt_bank', limit_choices_to={'account_type': 'asset'})
    post_dated_cheques_account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True, related_name='receipt_post_dated', limit_choices_to={'account_type': 'asset'})
    tenant_account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True, related_name='receipt_tenant', limit_choices_to={'account_type': 'asset'})
    cost_center = models.ForeignKey(CostCenter, on_delete=models.SET_NULL, null=True, blank=True, related_name='receipt_vouchers')
    accounting_posted = models.BooleanField(default=False, help_text="Whether accounting entry has been posted")
    
    # Audit Trail
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-payment_date']
        verbose_name = 'Receipt Voucher'
        verbose_name_plural = 'Receipt Vouchers'
    
    def __str__(self):
        return f"RV-{self.receipt_number} - {self.tenant.first_name} {self.tenant.last_name}"
    
    def save(self, *args, **kwargs):
        if not self.receipt_number:
            # Auto-generate receipt number
            last_receipt = ReceiptVoucher.objects.order_by('-id').first()
            if last_receipt and last_receipt.receipt_number:
                try:
                    last_num = int(last_receipt.receipt_number.split('-')[-1])
                    self.receipt_number = f"RV-{last_num + 1:05d}"
                except (ValueError, IndexError):
                    self.receipt_number = "RV-00001"
            else:
                self.receipt_number = "RV-00001"
        super().save(*args, **kwargs)


class CustomerInvoice(models.Model):
    """Customer invoice for tenant billing"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('paid', 'Paid'),
        ('void', 'Void'),
    ]

    invoice_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    tenant = models.ForeignKey(Tenant, on_delete=models.PROTECT, related_name='customer_invoices')
    lease = models.ForeignKey(
        'property.Lease',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='customer_invoices'
    )
    invoice_date = models.DateField()
    due_date = models.DateField(blank=True, null=True)

    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    is_taxable = models.BooleanField(default=False)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    income_account = models.ForeignKey(
        Account,
        on_delete=models.PROTECT,
        related_name='customer_invoice_income',
        limit_choices_to={'account_type': 'income'}
    )
    tax_account = models.ForeignKey(
        Account,
        on_delete=models.PROTECT,
        related_name='customer_invoice_tax',
        limit_choices_to={'account_type': 'liability'},
        null=True,
        blank=True
    )
    tenant_account = models.ForeignKey(
        Account,
        on_delete=models.PROTECT,
        related_name='customer_invoice_receivable',
        limit_choices_to={'account_type': 'asset'}
    )
    cost_center = models.ForeignKey(
        CostCenter,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='customer_invoices'
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    notes = models.TextField(blank=True)
    accounting_posted = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-invoice_date']
        verbose_name = 'Customer Invoice'
        verbose_name_plural = 'Customer Invoices'

    def __str__(self):
        return f"CI-{self.invoice_number} - {self.tenant.first_name} {self.tenant.last_name}"

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            last_invoice = CustomerInvoice.objects.order_by('-id').first()
            if last_invoice and last_invoice.invoice_number:
                try:
                    last_num = int(last_invoice.invoice_number.split('-')[-1])
                    self.invoice_number = f"CI-{last_num + 1:05d}"
                except (ValueError, IndexError):
                    self.invoice_number = "CI-00001"
            else:
                self.invoice_number = "CI-00001"
        super().save(*args, **kwargs)
