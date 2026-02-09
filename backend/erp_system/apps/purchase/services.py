from decimal import Decimal
from django.db import transaction
from django.core.exceptions import ValidationError
from erp_system.apps.accounts.models import Account, JournalEntry, JournalLine, CostCenter
from .models import SupplierInvoice, PaymentVoucher


class SupplierInvoiceService:
    """Service for supplier invoice accounting"""

    @staticmethod
    @transaction.atomic
    def post_supplier_invoice(invoice: SupplierInvoice):
        if invoice.accounting_posted:
            return None

        if invoice.amount <= 0:
            raise ValidationError('Invoice amount must be greater than 0.')

        tax_amount = invoice.tax_amount or Decimal('0.00')
        if invoice.is_taxable and tax_amount <= 0:
            tax_amount = (Decimal(invoice.amount) * Decimal(invoice.tax_rate) / Decimal('100.00')).quantize(Decimal('0.01'))

        total_amount = Decimal(invoice.amount) + Decimal(tax_amount)

        cost_center = invoice.cost_center
        if not cost_center and invoice.supplier.unit:
            cost_center = invoice.supplier.unit.cost_center
        if not cost_center:
            code = f"CC-SUPPLIER-{invoice.supplier.id:04d}"
            name = f"Supplier {invoice.supplier.first_name} {invoice.supplier.last_name}"
            cost_center, _ = CostCenter.objects.get_or_create(code=code, defaults={'name': name})

        if not invoice.supplier_account:
            invoice.supplier_account = invoice.supplier.ledger_account or Account.objects.filter(account_number='2400').first()
        if not invoice.supplier_account:
            raise ValidationError('Supplier account is required for supplier invoice posting.')

        entry = JournalEntry.objects.create(
            entry_type='invoice',
            reference_type='supplier_invoice',
            reference_id=invoice.id,
            description=f"Supplier invoice {invoice.invoice_number} - {invoice.supplier.first_name} {invoice.supplier.last_name}",
        )

        # Debit: Expense
        JournalLine.objects.create(
            journal_entry=entry,
            account=invoice.expense_account,
            debit=invoice.amount,
            credit=Decimal('0.00'),
            cost_center=cost_center,
            reference_type='supplier_invoice',
            reference_id=invoice.id,
        )

        # Debit: Tax (if applicable)
        if invoice.is_taxable and tax_amount > 0:
            if not invoice.tax_account:
                raise ValidationError('Tax account is required for taxable supplier invoices.')
            JournalLine.objects.create(
                journal_entry=entry,
                account=invoice.tax_account,
                debit=tax_amount,
                credit=Decimal('0.00'),
                cost_center=cost_center,
                reference_type='supplier_invoice',
                reference_id=invoice.id,
            )

        # Credit: Supplier payable
        JournalLine.objects.create(
            journal_entry=entry,
            account=invoice.supplier_account,
            debit=Decimal('0.00'),
            credit=total_amount,
            cost_center=cost_center,
            reference_type='supplier_invoice',
            reference_id=invoice.id,
        )

        invoice.tax_amount = tax_amount
        invoice.total_amount = total_amount
        invoice.accounting_posted = True
        if invoice.status == 'draft':
            invoice.status = 'submitted'
        invoice.save(update_fields=['tax_amount', 'total_amount', 'accounting_posted', 'status', 'supplier_account'])

        return entry


class PaymentVoucherService:
    """Service for supplier payment vouchers"""

    @staticmethod
    @transaction.atomic
    def post_payment_voucher(voucher: PaymentVoucher):
        if voucher.accounting_posted:
            return None

        # Determine credit account based on payment method
        if voucher.payment_method == 'cash':
            credit_account = voucher.cash_account or Account.objects.filter(account_number='1200').first()
        elif voucher.payment_method == 'bank':
            credit_account = voucher.bank_account or Account.objects.filter(account_number='1210').first()
        elif voucher.payment_method == 'cheque':
            credit_account = voucher.cheques_issued_account or Account.objects.filter(account_number='1240').first()
        else:
            raise ValidationError('Invalid payment method.')

        if not credit_account:
            raise ValidationError('Payment account is required for the selected payment method.')

        cost_center = voucher.cost_center
        if not cost_center and voucher.supplier.unit:
            cost_center = voucher.supplier.unit.cost_center
        if not cost_center:
            code = f"CC-SUPPLIER-{voucher.supplier.id:04d}"
            name = f"Supplier {voucher.supplier.first_name} {voucher.supplier.last_name}"
            cost_center, _ = CostCenter.objects.get_or_create(code=code, defaults={'name': name})

        if not voucher.supplier_account:
            voucher.supplier_account = voucher.supplier.ledger_account or Account.objects.filter(account_number='2400').first()
        if not voucher.supplier_account:
            raise ValidationError('Supplier account is required for payment posting.')

        entry = JournalEntry.objects.create(
            entry_type='payment',
            reference_type='payment_voucher',
            reference_id=voucher.id,
            description=f"Payment voucher {voucher.voucher_number} - {voucher.supplier.first_name} {voucher.supplier.last_name}",
        )

        # Debit: Supplier payable (reduce liability)
        JournalLine.objects.create(
            journal_entry=entry,
            account=voucher.supplier_account,
            debit=voucher.amount,
            credit=Decimal('0.00'),
            cost_center=cost_center,
            reference_type='payment_voucher',
            reference_id=voucher.id,
        )

        # Credit: Cash/Bank/Cheques issued
        JournalLine.objects.create(
            journal_entry=entry,
            account=credit_account,
            debit=Decimal('0.00'),
            credit=voucher.amount,
            cost_center=cost_center,
            reference_type='payment_voucher',
            reference_id=voucher.id,
        )

        voucher.accounting_posted = True
        if voucher.status == 'draft':
            voucher.status = 'submitted'
        voucher.save(update_fields=['accounting_posted', 'status', 'supplier_account'])

        return entry
