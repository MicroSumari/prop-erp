"""
Sales app services for receipt voucher accounting.
"""

from django.db import transaction
from erp_system.apps.accounts.models import Account, JournalEntry, JournalLine, CostCenter
from erp_system.apps.sales.models import ReceiptVoucher


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
            debit_account = receipt_voucher.cash_account
        elif receipt_voucher.payment_method == 'bank':
            debit_account = receipt_voucher.bank_account
        elif receipt_voucher.payment_method in ['cheque', 'post_dated_cheque']:
            debit_account = receipt_voucher.post_dated_cheques_account
        else:
            raise ValueError(f'Unknown payment method: {receipt_voucher.payment_method}')
        
        if not debit_account:
            raise ValueError(f'No account configured for payment method: {receipt_voucher.payment_method}')
        
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
            entry_type='prepaid',
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
        receipt_voucher.status = 'submitted'
        receipt_voucher.save()
        
        return journal_entry
