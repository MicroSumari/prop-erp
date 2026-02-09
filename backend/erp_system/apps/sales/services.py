"""
Sales app services for receipt voucher accounting.
"""

from django.db import transaction
from decimal import Decimal
from django.core.exceptions import ValidationError
from erp_system.apps.accounts.models import Account, JournalEntry, JournalLine, CostCenter
from erp_system.apps.sales.models import ReceiptVoucher, CustomerInvoice


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


class CustomerInvoiceService:
    """Service for customer invoice accounting"""

    @staticmethod
    @transaction.atomic
    def post_customer_invoice(invoice: CustomerInvoice):
        if invoice.accounting_posted:
            return None

        if invoice.amount <= 0:
            raise ValidationError('Invoice amount must be greater than 0.')

        tax_amount = invoice.tax_amount or Decimal('0.00')
        if invoice.is_taxable and tax_amount <= 0:
            tax_amount = (Decimal(invoice.amount) * Decimal(invoice.tax_rate) / Decimal('100.00')).quantize(Decimal('0.01'))

        total_amount = Decimal(invoice.amount) + Decimal(tax_amount)

        # Ensure cost center
        cost_center = invoice.cost_center
        if not cost_center and invoice.tenant.unit:
            cost_center = invoice.tenant.unit.cost_center
        if not cost_center:
            code = f"CC-TENANT-{invoice.tenant.id:04d}"
            name = f"Tenant {invoice.tenant.first_name} {invoice.tenant.last_name}"
            cost_center, _ = CostCenter.objects.get_or_create(code=code, defaults={'name': name})

        entry = JournalEntry.objects.create(
            entry_type='invoice',
            reference_type='customer_invoice',
            reference_id=invoice.id,
            description=f"Customer invoice {invoice.invoice_number} - {invoice.tenant.first_name} {invoice.tenant.last_name}",
        )

        # Ensure tenant receivable account
        if not invoice.tenant_account:
            invoice.tenant_account = invoice.tenant.ledger_account or Account.objects.filter(account_number='1100').first()
        if not invoice.tenant_account:
            raise ValidationError('Tenant account is required for invoice posting.')

        # Debit: Tenant Receivable
        JournalLine.objects.create(
            journal_entry=entry,
            account=invoice.tenant_account,
            debit=total_amount,
            credit=Decimal('0.00'),
            cost_center=cost_center,
            reference_type='customer_invoice',
            reference_id=invoice.id,
        )

        # Credit: Income
        JournalLine.objects.create(
            journal_entry=entry,
            account=invoice.income_account,
            debit=Decimal('0.00'),
            credit=invoice.amount,
            cost_center=cost_center,
            reference_type='customer_invoice',
            reference_id=invoice.id,
        )

        # Credit: Tax Payable (if applicable)
        if invoice.is_taxable and tax_amount > 0:
            if not invoice.tax_account:
                raise ValidationError('Tax account is required for taxable invoices.')
            JournalLine.objects.create(
                journal_entry=entry,
                account=invoice.tax_account,
                debit=Decimal('0.00'),
                credit=tax_amount,
                cost_center=cost_center,
                reference_type='customer_invoice',
                reference_id=invoice.id,
            )

        invoice.tax_amount = tax_amount
        invoice.total_amount = total_amount
        invoice.accounting_posted = True
        if invoice.status == 'draft':
            invoice.status = 'submitted'
        invoice.save(update_fields=['tax_amount', 'total_amount', 'accounting_posted', 'status'])

        return entry
