"""
Leasing accounting services for lease creation, renewal, termination, and receipt processing.
Implements strict double-entry accounting with cost centers and reference tracking.
"""

import calendar
from decimal import Decimal, ROUND_HALF_UP
from django.db import transaction
from django.utils import timezone
from erp_system.apps.accounts.models import Account, JournalEntry, JournalLine, CostCenter
from erp_system.apps.accounts.services import require_transaction_mapping
from erp_system.apps.property.models import Lease, LeaseRenewal, LeaseTermination, RentalLegalCase, RentalLegalCaseStatusHistory, Unit


class LeaseService:
    """Service for lease creation with accounting entry posting"""
    
    @staticmethod
    def _get_or_create_cost_center(unit, property_obj):
        """
        Get or create cost center for lease.
        Uses unit-level cost center if available, otherwise property-level.
        """
        if property_obj.classification and property_obj.classification.default_cost_center:
            return property_obj.classification.default_cost_center
        if unit and unit.cost_center:
            return unit.cost_center
        
        # Auto-create from unit if not exists
        if unit:
            code = f"CC-UNIT-{unit.id:04d}"
            name = f"{unit.property.name} - {unit.unit_number}"
            cost_center, created = CostCenter.objects.get_or_create(
                code=code,
                defaults={'name': name}
            )
            return cost_center
        
        # Fall back to property-level
        code = f"CC-PROP-{property_obj.id:04d}"
        name = f"{property_obj.name} - Property"
        cost_center, created = CostCenter.objects.get_or_create(
            code=code,
            defaults={'name': name}
        )
        return cost_center
    
    @staticmethod
    @transaction.atomic
    def create_lease(lease_data):
        """
        Create a lease and post accounting entry.
        
        Posting:
        Debit:  Tenant (Customer Account)
        Credit: Unearned Revenue
        Credit: Refundable Security Deposit
        Credit: Other Tenant Charges
        
        All amounts must be provided by caller.
        """
        require_transaction_mapping('lease_creation')

        # Extract accounting data
        unearned_account = lease_data.pop('unearned_revenue_account', None)
        deposit_account = lease_data.pop('refundable_deposit_account', None)
        other_charges_account = lease_data.pop('other_charges_account', None)
        
        # Create lease
        lease = Lease.objects.create(**lease_data)
        
        # Get cost center
        cost_center = LeaseService._get_or_create_cost_center(lease.unit, lease.unit.property)
        lease.cost_center = cost_center
        
        if not lease.rental_income_account and lease.unit.property.classification:
            lease.rental_income_account = lease.unit.property.classification.default_revenue_account

        # Validate accounts exist
        if not unearned_account or not deposit_account:
            raise ValueError('Unearned Revenue and Refundable Deposit accounts are required')
        
        # Create journal entry
        total_credit = lease.security_deposit + lease.monthly_rent
        if lease.other_charges and other_charges_account:
            total_credit += lease.other_charges
        
        journal_entry = JournalEntry.objects.create(
            entry_type='prepaid',
            reference_type='lease',
            reference_id=lease.id,
            description=f"Lease {lease.lease_number} creation - Tenant receivable"
        )
        
        # Debit: Tenant (Customer Account) - must be created separately
        # Note: Tenant account should be an asset account (customer receivable)
        tenant_account = Account.objects.filter(
            account_type='asset',
            account_name__icontains='tenant'
        ).first()
        
        if not tenant_account:
            raise ValueError('Tenant (Customer) Account not found. Please seed accounts first.')
        
        JournalLine.objects.create(
            journal_entry=journal_entry,
            account=tenant_account,
            debit=total_credit,
            cost_center=cost_center,
            reference_type='lease',
            reference_id=lease.id
        )
        
        # Credit: Unearned Revenue
        JournalLine.objects.create(
            journal_entry=journal_entry,
            account=unearned_account,
            credit=lease.monthly_rent,
            cost_center=cost_center,
            reference_type='lease',
            reference_id=lease.id
        )
        
        # Credit: Refundable Security Deposit
        JournalLine.objects.create(
            journal_entry=journal_entry,
            account=deposit_account,
            credit=lease.security_deposit,
            cost_center=cost_center,
            reference_type='lease',
            reference_id=lease.id
        )
        
        # Credit: Other Tenant Charges (if applicable)
        if lease.other_charges and other_charges_account:
            JournalLine.objects.create(
                journal_entry=journal_entry,
                account=other_charges_account,
                credit=lease.other_charges,
                cost_center=cost_center,
                reference_type='lease',
                reference_id=lease.id
            )
        
        lease.accounting_posted = True
        lease.save()
        
        return lease, journal_entry


class LeaseRenewalService:
    """Service for lease renewal activation with accounting"""
    
    @staticmethod
    @transaction.atomic
    def activate_renewal(renewal, new_lease_data):
        """
        Activate lease renewal: create new lease with same accounting logic as initial lease.
        
        new_lease_data should contain:
        - unearned_revenue_account
        - refundable_deposit_account
        - other_charges_account (optional)
        """
        # Create new lease with renewal terms
        lease_data = {
            'lease_number': f"{renewal.original_lease.lease_number}-REN-{renewal.id}",
            'unit': renewal.original_lease.unit,
            'tenant': renewal.original_lease.tenant,
            'start_date': renewal.new_start_date,
            'end_date': renewal.new_end_date,
            'monthly_rent': renewal.new_monthly_rent,
            'security_deposit': renewal.new_security_deposit or renewal.original_lease.security_deposit,
            'other_charges': 0,
            'status': 'active',
            'terms_conditions': renewal.terms_conditions or renewal.original_lease.terms_conditions,
        }
        
        # Add accounting fields
        lease_data['unearned_revenue_account'] = new_lease_data.get('unearned_revenue_account')
        lease_data['refundable_deposit_account'] = new_lease_data.get('refundable_deposit_account')
        lease_data['other_charges_account'] = new_lease_data.get('other_charges_account')
        
        # Create new lease via LeaseService
        new_lease, journal_entry = LeaseService.create_lease(lease_data)
        
        # End original lease
        renewal.original_lease.status = 'expired'
        renewal.original_lease.save()
        
        # Mark renewal as active
        renewal.status = 'active'
        renewal.activation_date = timezone.now().date()
        renewal.save()
        
        return new_lease, journal_entry


class LeaseTerminationService:
    """Service for lease termination with accounting"""
    
    @staticmethod
    @transaction.atomic
    def complete_normal_termination(termination):
        """
        Complete normal termination with accounting entry:
        
        Debit:  Refundable Security Deposit Account
        Credit: Tenant Account
        Credit: Maintenance Charges Account
        
        Requires: deposit_account, tenant_account, maintenance_charges_account
        """
        if not termination.deposit_account or not termination.tenant_account:
            raise ValueError('Deposit and Tenant accounts are required for normal termination')
        
        # Get or create cost center
        cost_center = LeaseTerminationService._get_or_create_cost_center(
            termination.lease.unit,
            termination.lease.unit.property
        )
        
        # Create journal entry
        journal_entry = JournalEntry.objects.create(
            entry_type='prepaid',
            reference_type='lease_termination',
            reference_id=termination.id,
            description=f"Lease {termination.lease.lease_number} normal termination - Security deposit refund"
        )
        
        # Debit: Refundable Security Deposit (liability reduction)
        JournalLine.objects.create(
            journal_entry=journal_entry,
            account=termination.deposit_account,
            debit=termination.refundable_amount,
            cost_center=cost_center,
            reference_type='lease_termination',
            reference_id=termination.id
        )
        
        # Credit: Tenant Account (customer payable)
        credit_to_tenant = termination.refundable_amount - termination.maintenance_charges
        JournalLine.objects.create(
            journal_entry=journal_entry,
            account=termination.tenant_account,
            credit=credit_to_tenant,
            cost_center=cost_center,
            reference_type='lease_termination',
            reference_id=termination.id
        )
        
        # Credit: Maintenance Charges (if applicable)
        if termination.maintenance_charges and termination.maintenance_charges_account:
            JournalLine.objects.create(
                journal_entry=journal_entry,
                account=termination.maintenance_charges_account,
                credit=termination.maintenance_charges,
                cost_center=cost_center,
                reference_type='lease_termination',
                reference_id=termination.id
            )
        
        termination.accounting_posted = True
        termination.save()
        
        return journal_entry


class LeaseRevenueRecognitionService:
    """Monthly revenue recognition for leases (Unearned → Income)"""

    @staticmethod
    def _calculate_prorated_amount(lease, run_date):
        month_days = calendar.monthrange(run_date.year, run_date.month)[1]
        period_start = run_date.replace(day=1)
        period_end = run_date.replace(day=month_days)

        start_date = max(lease.start_date, period_start)
        end_date = min(lease.end_date, period_end)
        if end_date < start_date:
            return Decimal('0.00')

        active_days = (end_date - start_date).days + 1
        amount = (Decimal(lease.monthly_rent) / Decimal(month_days)) * Decimal(active_days)
        return amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    @staticmethod
    @transaction.atomic
    def run_monthly_recognition(run_date=None):
        require_transaction_mapping('revenue_recognition')
        run_date = run_date or timezone.now().date()
        period = f"{run_date.year:04d}-{run_date.month:02d}"

        leases = Lease.objects.filter(
            status='active',
            start_date__lte=run_date,
            end_date__gte=run_date,
        )

        for lease in leases:
            if not lease.unearned_revenue_account or not lease.rental_income_account:
                continue

            existing = JournalEntry.objects.filter(
                reference_type='lease',
                reference_id=lease.id,
                entry_type='revenue_recognition',
                period=period,
            ).first()
            if existing:
                continue

            amount = LeaseRevenueRecognitionService._calculate_prorated_amount(lease, run_date)
            if amount <= Decimal('0.00'):
                continue

            cost_center = lease.cost_center or LeaseService._get_or_create_cost_center(
                lease.unit,
                lease.unit.property
            )
            if lease.cost_center_id != cost_center.id:
                lease.cost_center = cost_center
                lease.save(update_fields=['cost_center'])

            entry = JournalEntry.objects.create(
                entry_type='revenue_recognition',
                reference_type='lease',
                reference_id=lease.id,
                period=period,
                description=f"Lease {lease.lease_number} revenue recognition {period}",
            )

            JournalLine.objects.create(
                journal_entry=entry,
                account=lease.unearned_revenue_account,
                debit=amount,
                credit=Decimal('0.00'),
                cost_center=cost_center,
                reference_type='lease',
                reference_id=lease.id,
            )

            JournalLine.objects.create(
                journal_entry=entry,
                account=lease.rental_income_account,
                debit=Decimal('0.00'),
                credit=amount,
                cost_center=cost_center,
                reference_type='lease',
                reference_id=lease.id,
            )
    
    @staticmethod
    @transaction.atomic
    def complete_early_termination(termination):
        """
        Complete early termination with accounting entry:
        
        Debit:  Unearned Revenue Account
        Debit:  Refundable Security Deposit Account
        Credit: Tenant Account
        Credit: Post-Dated Cheques Account (if applicable)
        Credit: Early Termination Penalties Account
        Credit: Maintenance Charges Account
        
        Requires: unearned_revenue_account, deposit_account, tenant_account, penalty_account
        """
        required_accounts = [
            termination.unearned_revenue_account,
            termination.deposit_account,
            termination.tenant_account,
            termination.penalty_account
        ]
        
        if any(acc is None for acc in required_accounts):
            raise ValueError('Unearned Revenue, Deposit, Tenant, and Penalty accounts are required for early termination')
        
        # Get or create cost center
        cost_center = LeaseTerminationService._get_or_create_cost_center(
            termination.lease.unit,
            termination.lease.unit.property
        )
        
        # Create journal entry
        journal_entry = JournalEntry.objects.create(
            entry_type='prepaid',
            reference_type='lease_termination',
            reference_id=termination.id,
            description=f"Lease {termination.lease.lease_number} early termination - Unearned revenue reversal"
        )
        
        # Debit: Unearned Revenue (income reversal)
        JournalLine.objects.create(
            journal_entry=journal_entry,
            account=termination.unearned_revenue_account,
            debit=termination.unearned_rent,
            cost_center=cost_center,
            reference_type='lease_termination',
            reference_id=termination.id
        )
        
        # Debit: Refundable Security Deposit (liability reduction)
        JournalLine.objects.create(
            journal_entry=journal_entry,
            account=termination.deposit_account,
            debit=termination.refundable_amount,
            cost_center=cost_center,
            reference_type='lease_termination',
            reference_id=termination.id
        )
        
        # Calculate total credits
        total_debits = termination.unearned_rent + termination.refundable_amount
        total_credits = total_debits  # Must balance
        
        # Allocate credits: tenant, post-dated cheques, penalties, maintenance
        refund_to_tenant = total_credits - termination.early_termination_penalty - termination.maintenance_charges
        
        # Credit: Tenant Account
        JournalLine.objects.create(
            journal_entry=journal_entry,
            account=termination.tenant_account,
            credit=max(refund_to_tenant, 0),  # Only if positive
            cost_center=cost_center,
            reference_type='lease_termination',
            reference_id=termination.id
        )
        
        # Credit: Post-Dated Cheques (if applicable and adjusted)
        if termination.post_dated_cheques_adjusted and termination.post_dated_cheques_account:
            # Calculate amount based on uncleared cheques
            pdc_amount = min(termination.unearned_rent, total_credits)
            if pdc_amount > 0:
                JournalLine.objects.create(
                    journal_entry=journal_entry,
                    account=termination.post_dated_cheques_account,
                    credit=pdc_amount,
                    cost_center=cost_center,
                    reference_type='lease_termination',
                    reference_id=termination.id
                )
        
        # Credit: Early Termination Penalties
        if termination.early_termination_penalty:
            JournalLine.objects.create(
                journal_entry=journal_entry,
                account=termination.penalty_account,
                credit=termination.early_termination_penalty,
                cost_center=cost_center,
                reference_type='lease_termination',
                reference_id=termination.id
            )
        
        # Credit: Maintenance Charges (if applicable)
        if termination.maintenance_charges and termination.maintenance_charges_account:
            JournalLine.objects.create(
                journal_entry=journal_entry,
                account=termination.maintenance_charges_account,
                credit=termination.maintenance_charges,
                cost_center=cost_center,
                reference_type='lease_termination',
                reference_id=termination.id
            )
        
        termination.accounting_posted = True
        termination.save()
        
        return journal_entry
    
    @staticmethod
    def _get_or_create_cost_center(unit, property_obj):
        """Get or create cost center for termination"""
        if unit and unit.cost_center:
            return unit.cost_center
        
        if unit:
            code = f"CC-UNIT-{unit.id:04d}"
            name = f"{unit.property.name} - {unit.unit_number}"
        else:
            code = f"CC-PROP-{property_obj.id:04d}"
            name = f"{property_obj.name} - Property"
        
        cost_center, created = CostCenter.objects.get_or_create(
            code=code,
            defaults={'name': name}
        )
        return cost_center


class ReceiptVoucherService:
    """Service for receipt voucher (tenant payment) accounting"""
    
    @staticmethod
    @transaction.atomic
    def post_receipt_voucher(receipt_voucher):
        """
        Post receipt voucher accounting entry:
        
        Debit:  Cash / Bank / Post-Dated Cheques (based on payment method)
        Credit: Tenant Account (receivable reduction)
        
        Requires: payment_method and corresponding account + tenant_account
        """
        # Determine debit account based on payment method
        if receipt_voucher.payment_method == 'cash':
            debit_account = receipt_voucher.cash_account or Account.objects.filter(account_number='1200').first()
        elif receipt_voucher.payment_method == 'bank':
            debit_account = receipt_voucher.bank_account or Account.objects.filter(account_number='1210').first()
        elif receipt_voucher.payment_method in ['cheque', 'post_dated_cheque']:
            debit_account = receipt_voucher.post_dated_cheques_account or Account.objects.filter(account_number='1230').first()
        else:
            raise ValueError(f'Unknown payment method: {receipt_voucher.payment_method}')
        
        if not debit_account:
            raise ValueError(f'No account configured for payment method: {receipt_voucher.payment_method}')
        
        if not receipt_voucher.tenant_account:
            receipt_voucher.tenant_account = receipt_voucher.tenant.ledger_account or Account.objects.filter(account_number='1100').first()

        if not receipt_voucher.tenant_account:
            raise ValueError('Tenant account is required for receipt posting')
        
        # Get cost center (from lease unit if exists)
        cost_center = receipt_voucher.cost_center
        if not cost_center and receipt_voucher.tenant.unit:
            cost_center = receipt_voucher.tenant.unit.cost_center
        
        if not cost_center:
            # Create default cost center
            code = f"CC-TENANT-{receipt_voucher.tenant.id:04d}"
            name = f"Tenant {receipt_voucher.tenant.first_name} {receipt_voucher.tenant.last_name}"
            cost_center, created = CostCenter.objects.get_or_create(
                code=code,
                defaults={'name': name}
            )
        
        # Create journal entry
        journal_entry = JournalEntry.objects.create(
            entry_type='receipt',
            reference_type='receipt_voucher',
            reference_id=receipt_voucher.id,
            description=f"Receipt {receipt_voucher.receipt_number} - {receipt_voucher.tenant.first_name} {receipt_voucher.tenant.last_name}"
        )
        
        # Debit: Asset account (Cash/Bank/Cheques)
        JournalLine.objects.create(
            journal_entry=journal_entry,
            account=debit_account,
            debit=receipt_voucher.amount,
            cost_center=cost_center,
            reference_type='receipt_voucher',
            reference_id=receipt_voucher.id
        )
        
        # Credit: Tenant Account (reduce receivable)
        JournalLine.objects.create(
            journal_entry=journal_entry,
            account=receipt_voucher.tenant_account,
            credit=receipt_voucher.amount,
            cost_center=cost_center,
            reference_type='receipt_voucher',
            reference_id=receipt_voucher.id
        )
        
        receipt_voucher.accounting_posted = True
        if receipt_voucher.status == 'draft':
            receipt_voucher.status = 'submitted'
        receipt_voucher.save(update_fields=['accounting_posted', 'status', 'tenant_account'])
        
        return journal_entry


class RentalLegalCaseService:
    """Service for rental legal case management - NO accounting entries"""
    
    ALLOWED_STATUS_TRANSITIONS = {
        'filed': ['in_progress'],
        'in_progress': ['judgment_passed', 'closed_tenant_won', 'closed_owner_won'],
        'judgment_passed': ['closed_tenant_won', 'closed_owner_won'],
        'closed_tenant_won': [],
        'closed_owner_won': [],
    }
    
    @staticmethod
    @transaction.atomic
    def create_case(case_data, created_by=''):
        """
        Create a rental legal case and update unit status.
        
        NO accounting entries are created.
        Cost center comes from unit.
        """
        # Extract related objects
        tenant = case_data.get('tenant')
        lease = case_data.get('lease')
        unit = lease.unit if lease else case_data.get('unit')
        property_obj = unit.property if unit else case_data.get('property')
        
        # Validate tenant-lease relationship
        if lease and lease.tenant_id != tenant.id:
            raise ValueError('Selected lease does not belong to the selected tenant.')
        
        # Refresh unit to ensure cost_center is populated (auto-created in Unit.save())
        if unit:
            unit.refresh_from_db()
        
        # Get cost center from unit
        cost_center = unit.cost_center if unit else None
        if not cost_center:
            raise ValueError('Unit must have a cost center before creating a legal case.')
        
        # Create legal case
        legal_case = RentalLegalCase.objects.create(
            tenant=tenant,
            lease=lease,
            property=property_obj,
            unit=unit,
            cost_center=cost_center,
            case_type=case_data.get('case_type'),
            case_number=case_data.get('case_number'),
            filing_date=case_data.get('filing_date'),
            current_status='filed',
            court_name=case_data.get('court_name', ''),
            remarks=case_data.get('remarks', ''),
            created_by=created_by,
        )
        
        # Update unit status
        RentalLegalCaseService.sync_unit_status(legal_case)
        
        # Create initial status history
        RentalLegalCaseStatusHistory.objects.create(
            legal_case=legal_case,
            previous_status='',
            new_status='filed',
            change_reason='Case filed',
            changed_by=created_by,
        )
        
        return legal_case
    
    @staticmethod
    @transaction.atomic
    def update_case(legal_case, update_data):
        """
        Update non-status fields of legal case.
        Does NOT change status or unit status.
        """
        allowed_fields = ['case_type', 'case_number', 'court_name', 'filing_date', 'remarks']
        
        for field in allowed_fields:
            if field in update_data:
                setattr(legal_case, field, update_data[field])
        
        legal_case.save()
        return legal_case
    
    @staticmethod
    @transaction.atomic
    def change_status(legal_case, new_status, change_reason='', changed_by=''):
        """
        Change legal case status with validation.
        Updates unit status accordingly.
        Logs status history.
        """
        current_status = legal_case.current_status
        
        # Validate transition
        allowed_next = RentalLegalCaseService.ALLOWED_STATUS_TRANSITIONS.get(current_status, [])
        if new_status not in allowed_next:
            raise ValueError(
                f"Invalid status transition: {current_status} → {new_status}. "
                f"Allowed transitions: {', '.join(allowed_next) if allowed_next else 'None (case closed)'}"
            )
        
        # Update status
        legal_case.current_status = new_status
        legal_case.save()
        
        # Update unit status
        RentalLegalCaseService.sync_unit_status(legal_case)
        
        # Log status history
        RentalLegalCaseStatusHistory.objects.create(
            legal_case=legal_case,
            previous_status=current_status,
            new_status=new_status,
            change_reason=change_reason,
            changed_by=changed_by,
        )
        
        return legal_case
    
    @staticmethod
    def sync_unit_status(legal_case):
        """
        Update unit status based on legal case status.
        """
        unit = legal_case.unit
        
        # Map case status to unit status
        status_map = {
            'filed': 'under_legal_case',
            'in_progress': 'under_legal_case',
            'judgment_passed': 'blocked',
            'closed_tenant_won': 'occupied',
            'closed_owner_won': 'vacant',
        }
        
        new_unit_status = status_map.get(legal_case.current_status, 'under_legal_case')
        
        if unit.status != new_unit_status:
            unit.status = new_unit_status
            unit.save(update_fields=['status'])
        
        return unit
