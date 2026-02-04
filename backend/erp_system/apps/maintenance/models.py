from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from erp_system.apps.property.models import Property, Unit, Tenant
from erp_system.apps.accounts.models import Account, CostCenter


class MaintenanceRequest(models.Model):
    """Maintenance request (no accounting)"""
    REQUEST_TYPE_CHOICES = [
        ('plumbing', 'Plumbing'),
        ('electrical', 'Electrical'),
        ('hvac', 'HVAC'),
        ('carpentry', 'Carpentry'),
        ('general', 'General'),
        ('other', 'Other'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]

    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    property = models.ForeignKey(Property, on_delete=models.PROTECT, related_name='maintenance_requests')
    unit = models.ForeignKey(Unit, on_delete=models.PROTECT, related_name='maintenance_requests')
    cost_center = models.ForeignKey(CostCenter, on_delete=models.PROTECT, related_name='maintenance_requests')
    request_type = models.CharField(max_length=30, choices=REQUEST_TYPE_CHOICES)
    description = models.TextField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='maintenance_requests')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Request {self.id} - {self.request_type}"


class MaintenanceContract(models.Model):
    """Maintenance contract with prepaid accounting"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('completed', 'Completed'),
    ]

    supplier = models.ForeignKey(Tenant, on_delete=models.PROTECT, related_name='maintenance_contracts')
    property = models.ForeignKey(Property, on_delete=models.PROTECT, related_name='maintenance_contracts')
    unit = models.ForeignKey(Unit, on_delete=models.PROTECT, null=True, blank=True, related_name='maintenance_contracts')
    cost_center = models.ForeignKey(CostCenter, on_delete=models.PROTECT, related_name='maintenance_contracts')

    start_date = models.DateField()
    end_date = models.DateField()
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    duration_months = models.PositiveIntegerField()
    amortized_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    prepaid_account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name='maintenance_prepaid_contracts')
    expense_account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name='maintenance_expense_contracts')
    supplier_account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name='maintenance_supplier_contracts')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Contract {self.id} - {self.supplier}"
