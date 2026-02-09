from django.db import models
from django.core.validators import MinValueValidator
from erp_system.apps.property.models import Tenant
from erp_system.apps.accounts.models import Account, CostCenter


class PurchaseOrder(models.Model):
    """Purchase Order model"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('received', 'Received'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    po_number = models.CharField(max_length=50, unique=True)
    vendor = models.CharField(max_length=200)
    
    po_date = models.DateField()
    expected_delivery_date = models.DateField()
    
    total_amount = models.DecimalField(max_digits=15, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"PO-{self.po_number}"


class SupplierInvoice(models.Model):
    """Supplier invoice for expenses"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('paid', 'Paid'),
        ('void', 'Void'),
    ]

    invoice_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    supplier = models.ForeignKey(Tenant, on_delete=models.PROTECT, related_name='supplier_invoices')
    invoice_date = models.DateField()
    due_date = models.DateField(blank=True, null=True)

    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    is_taxable = models.BooleanField(default=False)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    expense_account = models.ForeignKey(
        Account,
        on_delete=models.PROTECT,
        related_name='supplier_invoice_expenses',
        limit_choices_to={'account_type': 'expense'}
    )
    supplier_account = models.ForeignKey(
        Account,
        on_delete=models.PROTECT,
        related_name='supplier_invoice_payables',
        limit_choices_to={'account_type': 'liability'}
    )
    tax_account = models.ForeignKey(
        Account,
        on_delete=models.PROTECT,
        related_name='supplier_invoice_taxes',
        limit_choices_to={'account_type': 'liability'},
        null=True,
        blank=True
    )
    cost_center = models.ForeignKey(
        CostCenter,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='supplier_invoices'
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    notes = models.TextField(blank=True)
    accounting_posted = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-invoice_date']

    def __str__(self):
        return f"SI-{self.invoice_number} - {self.supplier.first_name} {self.supplier.last_name}"

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            last_invoice = SupplierInvoice.objects.order_by('-id').first()
            if last_invoice and last_invoice.invoice_number:
                try:
                    last_num = int(last_invoice.invoice_number.split('-')[-1])
                    self.invoice_number = f"SI-{last_num + 1:05d}"
                except (ValueError, IndexError):
                    self.invoice_number = "SI-00001"
            else:
                self.invoice_number = "SI-00001"
        super().save(*args, **kwargs)


class PaymentVoucher(models.Model):
    """Payment voucher to settle supplier invoices"""
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('bank', 'Bank Transfer'),
        ('cheque', 'Cheque'),
    ]

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('cleared', 'Cleared'),
        ('cancelled', 'Cancelled'),
    ]

    voucher_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    supplier = models.ForeignKey(Tenant, on_delete=models.PROTECT, related_name='payment_vouchers')
    supplier_invoice = models.ForeignKey(
        SupplierInvoice,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payment_vouchers'
    )
    payment_date = models.DateField()
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)

    cash_account = models.ForeignKey(
        Account,
        on_delete=models.PROTECT,
        related_name='payment_cash',
        limit_choices_to={'account_type': 'asset'},
        null=True,
        blank=True
    )
    bank_account = models.ForeignKey(
        Account,
        on_delete=models.PROTECT,
        related_name='payment_bank',
        limit_choices_to={'account_type': 'asset'},
        null=True,
        blank=True
    )
    cheques_issued_account = models.ForeignKey(
        Account,
        on_delete=models.PROTECT,
        related_name='payment_cheques_issued',
        limit_choices_to={'account_type': 'liability'},
        null=True,
        blank=True
    )
    supplier_account = models.ForeignKey(
        Account,
        on_delete=models.PROTECT,
        related_name='payment_supplier',
        limit_choices_to={'account_type': 'liability'}
    )
    cost_center = models.ForeignKey(
        CostCenter,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payment_vouchers'
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    description = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    accounting_posted = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-payment_date']

    def __str__(self):
        return f"PV-{self.voucher_number} - {self.supplier.first_name} {self.supplier.last_name}"

    def save(self, *args, **kwargs):
        if not self.voucher_number:
            last_voucher = PaymentVoucher.objects.order_by('-id').first()
            if last_voucher and last_voucher.voucher_number:
                try:
                    last_num = int(last_voucher.voucher_number.split('-')[-1])
                    self.voucher_number = f"PV-{last_num + 1:05d}"
                except (ValueError, IndexError):
                    self.voucher_number = "PV-00001"
            else:
                self.voucher_number = "PV-00001"
        super().save(*args, **kwargs)
