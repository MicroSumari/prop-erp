from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from erp_system.apps.accounts.models import CostCenter


class Property(models.Model):
    """Property/Building model"""
    PROPERTY_TYPE_CHOICES = [
        ('residential', 'Residential'),
        ('commercial', 'Commercial'),
        ('industrial', 'Industrial'),
        ('land', 'Land'),
        ('mixed', 'Mixed Use'),
    ]
    
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('occupied', 'Occupied'),
        ('maintenance', 'Under Maintenance'),
        ('leased', 'Leased'),
        ('sold', 'Sold'),
    ]
    
    # Basic Information
    property_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    property_type = models.CharField(max_length=20, choices=PROPERTY_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    
    # Location Information
    street_address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=20, blank=True, null=True)
    country = models.CharField(max_length=100)
    
    # Financial Information
    purchase_price = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)], blank=True, null=True)
    market_value = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    
    # Property Details
    total_area = models.DecimalField(max_digits=10, decimal_places=2, help_text="in sq. meters", blank=True, null=True)
    built_area = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    number_of_units = models.IntegerField(default=1, blank=True, null=True)
    year_built = models.IntegerField(blank=True, null=True)
    
    # Ownership & Dates
    owner = models.ForeignKey(User, on_delete=models.PROTECT, related_name='properties', null=True, blank=True)
    acquisition_date = models.DateField()

    # Classification
    classification = models.ForeignKey(
        'accounts.PropertyClassification',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='properties'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Properties'
    
    def __str__(self):
        return f"{self.name} ({self.property_id})"


class Unit(models.Model):
    """Individual units within a property"""
    UNIT_STATUS_CHOICES = [
        ('vacant', 'Vacant'),
        ('occupied', 'Occupied'),
        ('maintenance', 'Under Maintenance'),
        ('under_legal_case', 'Under Legal Case'),
        ('blocked', 'Blocked'),
    ]
    
    unit_number = models.CharField(max_length=50)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='units')
    unit_type = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=25, choices=UNIT_STATUS_CHOICES, default='vacant')
    cost_center = models.ForeignKey(CostCenter, on_delete=models.SET_NULL, null=True, blank=True, related_name='units')
    
    # Area Details
    area = models.DecimalField(max_digits=10, decimal_places=2)
    bedrooms = models.IntegerField(default=0)
    bathrooms = models.IntegerField(default=0)
    
    # Lease Information
    monthly_rent = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('property', 'unit_number')
        ordering = ['unit_number']
    
    def __str__(self):
        return f"{self.property.name} - Unit {self.unit_number}"

    def _get_or_create_cost_center(self):
        code = f"CC-UNIT-{self.id:04d}"
        name = f"{self.property.name} - {self.unit_number}"
        cost_center, _ = CostCenter.objects.get_or_create(
            code=code,
            defaults={'name': name}
        )
        return cost_center

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        if not self.cost_center:
            cost_center = self._get_or_create_cost_center()
            if self.cost_center_id != cost_center.id:
                self.cost_center = cost_center
                super().save(update_fields=['cost_center'])


class Tenant(models.Model):
    """Tenant information"""
    unit = models.OneToOneField(Unit, on_delete=models.SET_NULL, null=True, blank=True, related_name='tenant')
    
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    
    move_in_date = models.DateField()
    move_out_date = models.DateField(blank=True, null=True)
    
    emergency_contact = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    
    # Ledger Account
    has_ledger_account = models.BooleanField(
        default=True,
        help_text="Whether this tenant has a customer/supplier ledger account"
    )
    ledger_account_type = models.CharField(
        max_length=20,
        choices=[('customer', 'Customer'), ('supplier', 'Supplier')],
        default='customer',
        help_text="Type of ledger account"
    )
    ledger_account = models.ForeignKey(
        'accounts.Account',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tenant_ledgers',
        limit_choices_to={'account_type__in': ['asset', 'liability']},
        help_text="Customer/Supplier account in chart of accounts"
    )

    cost_center = models.ForeignKey(
        CostCenter,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tenants',
        help_text="Cost center for tenant-related tracking"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    def _get_or_create_cost_center(self):
        code = f"CC-TENANT-{self.id:04d}"
        name = f"Tenant {self.first_name} {self.last_name}"
        cost_center, _ = CostCenter.objects.get_or_create(
            code=code,
            defaults={'name': name}
        )
        return cost_center

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        if not self.cost_center:
            cost_center = self._get_or_create_cost_center()
            if self.cost_center_id != cost_center.id:
                self.cost_center = cost_center
                super().save(update_fields=['cost_center'])


class Lease(models.Model):
    """Lease agreements"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('terminated', 'Terminated'),
    ]
    
    lease_number = models.CharField(max_length=50, unique=True)
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='leases')
    tenant = models.ForeignKey(Tenant, on_delete=models.SET_NULL, null=True, blank=True)
    
    start_date = models.DateField()
    end_date = models.DateField()
    monthly_rent = models.DecimalField(max_digits=10, decimal_places=2)
    security_deposit = models.DecimalField(max_digits=10, decimal_places=2)
    other_charges = models.DecimalField(max_digits=10, decimal_places=2, default=0, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Lease Terms
    terms_conditions = models.TextField(blank=True, null=True)
    
    # Accounting Fields
    cost_center = models.ForeignKey(CostCenter, on_delete=models.SET_NULL, null=True, blank=True, related_name='leases')
    unearned_revenue_account = models.ForeignKey('accounts.Account', on_delete=models.SET_NULL, null=True, blank=True, related_name='lease_unearned_revenue', limit_choices_to={'account_type': 'liability'})
    rental_income_account = models.ForeignKey('accounts.Account', on_delete=models.SET_NULL, null=True, blank=True, related_name='lease_rental_income', limit_choices_to={'account_type': 'income'})
    refundable_deposit_account = models.ForeignKey('accounts.Account', on_delete=models.SET_NULL, null=True, blank=True, related_name='lease_deposits', limit_choices_to={'account_type': 'liability'})
    other_charges_account = models.ForeignKey('accounts.Account', on_delete=models.SET_NULL, null=True, blank=True, related_name='lease_other_charges', limit_choices_to={'account_type': 'income'})
    accounting_posted = models.BooleanField(default=False, help_text="Whether accounting entry has been posted")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Lease {self.lease_number} - {self.unit}"


class Maintenance(models.Model):
    """Maintenance records and work orders"""
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    maintenance_id = models.CharField(max_length=50, unique=True)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='maintenance_records')
    unit = models.ForeignKey(Unit, on_delete=models.SET_NULL, null=True, blank=True)
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Dates
    reported_date = models.DateTimeField(auto_now_add=True)
    scheduled_date = models.DateField(blank=True, null=True)
    completed_date = models.DateField(blank=True, null=True)
    
    # Cost
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    actual_cost = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    
    assigned_to = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-reported_date']
    
    def __str__(self):
        return f"MNT-{self.maintenance_id} - {self.title}"


class Expense(models.Model):
    """Property expenses tracking"""
    EXPENSE_TYPE_CHOICES = [
        ('maintenance', 'Maintenance'),
        ('utilities', 'Utilities'),
        ('insurance', 'Insurance'),
        ('tax', 'Property Tax'),
        ('management', 'Management Fees'),
        ('other', 'Other'),
    ]
    
    expense_id = models.CharField(max_length=50, unique=True)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='expenses')
    
    expense_type = models.CharField(max_length=20, choices=EXPENSE_TYPE_CHOICES)
    description = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    expense_date = models.DateField()
    due_date = models.DateField(blank=True, null=True)
    
    vendor = models.CharField(max_length=200, blank=True)
    invoice_number = models.CharField(max_length=50, blank=True)
    
    # Payment Status
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
    ]
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    paid_date = models.DateField(blank=True, null=True)
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-expense_date']
    
    def __str__(self):
        return f"EXP-{self.expense_id} - {self.description}"


class Rent(models.Model):
    """Rent payments tracking"""
    lease = models.ForeignKey(Lease, on_delete=models.CASCADE, related_name='rent_payments')
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='rent_payments')
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('partial', 'Partial'),
    ]
    
    rent_date = models.DateField()
    due_date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    paid_date = models.DateField(blank=True, null=True)
    
    payment_method = models.CharField(max_length=50, blank=True)
    transaction_id = models.CharField(max_length=100, blank=True)
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-rent_date']
        unique_together = ('lease', 'rent_date')
    
    def __str__(self):
        return f"Rent {self.rent_date} - {self.tenant.first_name} {self.tenant.last_name}"


class LeaseRenewal(models.Model):
    """Lease Renewal - Extends existing lease with new terms"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending_approval', 'Pending Approval'),
        ('approved', 'Approved'),
        ('active', 'Active'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]
    
    renewal_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    original_lease = models.ForeignKey(Lease, on_delete=models.CASCADE, related_name='renewals')
    
    # Original Lease Information
    original_start_date = models.DateField()
    original_end_date = models.DateField()
    original_monthly_rent = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Renewal Terms
    new_start_date = models.DateField()
    new_end_date = models.DateField()
    new_monthly_rent = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Security Deposit (if changing)
    new_security_deposit = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True,
        help_text="Leave blank if unchanged"
    )
    
    # Status and Dates
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    renewal_date = models.DateField(auto_now_add=True)
    approval_date = models.DateField(blank=True, null=True)
    activation_date = models.DateField(blank=True, null=True)
    
    # Terms and Conditions
    terms_conditions = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True)
    
    # Audit Trail
    created_by = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-renewal_date']
        verbose_name = 'Lease Renewal'
        verbose_name_plural = 'Lease Renewals'
    
    def save(self, *args, **kwargs):
        if not self.renewal_number:
            # Auto-generate renewal number
            last_renewal = LeaseRenewal.objects.order_by('-id').first()
            if last_renewal and last_renewal.renewal_number:
                try:
                    last_num = int(last_renewal.renewal_number.split('-')[-1])
                    self.renewal_number = f"REN-{last_num + 1:05d}"
                except (ValueError, IndexError):
                    self.renewal_number = f"REN-{self.id or 1:05d}"
            else:
                self.renewal_number = "REN-00001"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Renewal-{self.renewal_number} - {self.original_lease.lease_number}"


class LeaseTermination(models.Model):
    """Lease Termination - Handles normal and early termination with accounting entries"""
    TERMINATION_TYPE_CHOICES = [
        ('normal', 'Normal Termination'),
        ('early', 'Early Termination'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending_approval', 'Pending Approval'),
        ('approved', 'Approved'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]
    
    termination_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    lease = models.ForeignKey(Lease, on_delete=models.CASCADE, related_name='terminations')
    
    # Termination Details
    termination_type = models.CharField(max_length=20, choices=TERMINATION_TYPE_CHOICES)
    termination_date = models.DateField()
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    approval_date = models.DateField(blank=True, null=True)
    completion_date = models.DateField(blank=True, null=True)
    
    # Security Deposit Handling
    original_security_deposit = models.DecimalField(max_digits=10, decimal_places=2)
    refundable_amount = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text="Amount to be refunded to tenant"
    )
    
    # Early Termination Specific
    unearned_rent = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        help_text="For early termination: unearned rent to be reversed"
    )
    early_termination_penalty = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        help_text="Penalty charged for early termination"
    )
    
    # Normal Termination Specific
    maintenance_charges = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        help_text="Maintenance/repairs to be charged to tenant"
    )
    
    # Post-Dated Cheques Handling (for early termination)
    post_dated_cheques_adjusted = models.BooleanField(
        default=False,
        help_text="Whether post-dated cheques have been adjusted/cancelled"
    )
    post_dated_cheques_notes = models.TextField(
        blank=True,
        help_text="Details of cheque adjustments"
    )
    
    # Summary
    net_refund = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        help_text="Final amount to be refunded (or charged if negative)"
    )
    
    # Accounting Fields
    deposit_account = models.ForeignKey('accounts.Account', on_delete=models.SET_NULL, null=True, blank=True, related_name='lease_termination_deposits', limit_choices_to={'account_type': 'liability'})
    unearned_revenue_account = models.ForeignKey('accounts.Account', on_delete=models.SET_NULL, null=True, blank=True, related_name='lease_termination_unearned', limit_choices_to={'account_type': 'income'})
    tenant_account = models.ForeignKey('accounts.Account', on_delete=models.SET_NULL, null=True, blank=True, related_name='lease_termination_tenant', limit_choices_to={'account_type': 'asset'})
    maintenance_charges_account = models.ForeignKey('accounts.Account', on_delete=models.SET_NULL, null=True, blank=True, related_name='lease_termination_maintenance', limit_choices_to={'account_type': 'expense'})
    post_dated_cheques_account = models.ForeignKey('accounts.Account', on_delete=models.SET_NULL, null=True, blank=True, related_name='lease_termination_cheques', limit_choices_to={'account_type': 'asset'})
    penalty_account = models.ForeignKey('accounts.Account', on_delete=models.SET_NULL, null=True, blank=True, related_name='lease_termination_penalties', limit_choices_to={'account_type': 'income'})
    accounting_posted = models.BooleanField(default=False, help_text="Whether accounting entries have been posted")
    
    # Documentation
    terms_conditions = models.TextField(blank=True, null=True)
    exit_notes = models.TextField(blank=True, help_text="Tenant exit notes, damage report, etc.")
    notes = models.TextField(blank=True)
    
    # Audit Trail
    created_by = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-termination_date']
        verbose_name = 'Lease Termination'
        verbose_name_plural = 'Lease Terminations'
    
    def save(self, *args, **kwargs):
        if not self.termination_number:
            # Auto-generate termination number
            last_termination = LeaseTermination.objects.order_by('-id').first()
            if last_termination and last_termination.termination_number:
                try:
                    last_num = int(last_termination.termination_number.split('-')[-1])
                    self.termination_number = f"TERM-{last_num + 1:05d}"
                except (ValueError, IndexError):
                    self.termination_number = f"TERM-{self.id or 1:05d}"
            else:
                self.termination_number = "TERM-00001"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Term-{self.termination_number} - {self.lease.lease_number}"
    
    def calculate_net_refund(self):
        """Calculate net refund based on termination type"""
        if self.termination_type == 'normal':
            # Debit: Security Deposit
            # Credit: Maintenance Charges
            self.net_refund = self.refundable_amount - self.maintenance_charges
        else:  # early termination
            # Debit: Unearned Revenue + Security Deposit
            # Credit: Penalty + Maintenance
            self.net_refund = (self.refundable_amount + self.unearned_rent) - \
                            (self.early_termination_penalty + self.maintenance_charges)
        
        return self.net_refund


class RentalLegalCase(models.Model):
    """Legal cases against tenants - NO accounting entries"""
    CASE_TYPE_CHOICES = [
        ('eviction', 'Eviction'),
        ('non_payment', 'Non-Payment'),
        ('damage', 'Property Damage'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('filed', 'Filed'),
        ('in_progress', 'In Progress'),
        ('judgment_passed', 'Judgment Passed'),
        ('closed_tenant_won', 'Closed (Tenant Won)'),
        ('closed_owner_won', 'Closed (Owner Won)'),
    ]
    
    # Core References
    tenant = models.ForeignKey(Tenant, on_delete=models.PROTECT, related_name='legal_cases')
    lease = models.ForeignKey(Lease, on_delete=models.PROTECT, related_name='legal_cases')
    property = models.ForeignKey(Property, on_delete=models.PROTECT, related_name='legal_cases')
    unit = models.ForeignKey(Unit, on_delete=models.PROTECT, related_name='legal_cases')
    cost_center = models.ForeignKey(CostCenter, on_delete=models.PROTECT, related_name='legal_cases')
    
    # Case Details
    case_type = models.CharField(max_length=20, choices=CASE_TYPE_CHOICES)
    case_number = models.CharField(max_length=100, help_text="External case reference number")
    filing_date = models.DateField()
    current_status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='filed')
    court_name = models.CharField(max_length=200)
    remarks = models.TextField(blank=True)
    
    # Audit Trail
    created_by = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-filing_date']
        verbose_name = 'Rental Legal Case'
        verbose_name_plural = 'Rental Legal Cases'
    
    def __str__(self):
        return f"Case {self.case_number} - {self.tenant}"
    
    def get_unit_status_for_case_status(self):
        """Map case status to unit status"""
        status_map = {
            'filed': 'Under Legal Case',
            'in_progress': 'Under Legal Case',
            'judgment_passed': 'Blocked',
            'closed_tenant_won': 'Occupied',
            'closed_owner_won': 'Vacant',
        }
        return status_map.get(self.current_status, 'Under Legal Case')


class RentalLegalCaseStatusHistory(models.Model):
    """Audit trail for legal case status changes"""
    legal_case = models.ForeignKey(RentalLegalCase, on_delete=models.CASCADE, related_name='status_history')
    previous_status = models.CharField(max_length=30)
    new_status = models.CharField(max_length=30)
    change_reason = models.TextField(blank=True)
    changed_by = models.CharField(max_length=200)
    changed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-changed_at']
        verbose_name = 'Legal Case Status History'
        verbose_name_plural = 'Legal Case Status Histories'
    
    def __str__(self):
        return f"{self.legal_case.case_number}: {self.previous_status} → {self.new_status}"

