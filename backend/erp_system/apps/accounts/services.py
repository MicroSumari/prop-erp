from decimal import Decimal
from django.db import transaction
from django.core.exceptions import ValidationError
from .models import JournalEntry, JournalLine, ChequeRegister


class ChequeRegisterService:
    """Service for cheque register status changes and accounting"""

    @staticmethod
    @transaction.atomic
    def mark_cleared(cheque: ChequeRegister):
        if cheque.status == 'cleared':
            return None

        if not cheque.bank_account:
            raise ValidationError('Bank account is required to clear cheque.')

        if cheque.cheque_type == 'incoming':
            if not cheque.cheques_received_account:
                raise ValidationError('Cheques received account is required for incoming cheque.')
            entry = JournalEntry.objects.create(
                entry_type='cheque',
                reference_type='cheque_register',
                reference_id=cheque.id,
                description=f"Cheque cleared (incoming) {cheque.cheque_number}",
            )
            JournalLine.objects.create(
                journal_entry=entry,
                account=cheque.bank_account,
                debit=cheque.amount,
                credit=Decimal('0.00'),
                cost_center=cheque.cost_center,
                reference_type='cheque_register',
                reference_id=cheque.id,
            )
            JournalLine.objects.create(
                journal_entry=entry,
                account=cheque.cheques_received_account,
                debit=Decimal('0.00'),
                credit=cheque.amount,
                cost_center=cheque.cost_center,
                reference_type='cheque_register',
                reference_id=cheque.id,
            )
        else:
            if not cheque.cheques_issued_account:
                raise ValidationError('Cheques issued account is required for outgoing cheque.')
            entry = JournalEntry.objects.create(
                entry_type='cheque',
                reference_type='cheque_register',
                reference_id=cheque.id,
                description=f"Cheque cleared (outgoing) {cheque.cheque_number}",
            )
            JournalLine.objects.create(
                journal_entry=entry,
                account=cheque.cheques_issued_account,
                debit=cheque.amount,
                credit=Decimal('0.00'),
                cost_center=cheque.cost_center,
                reference_type='cheque_register',
                reference_id=cheque.id,
            )
            JournalLine.objects.create(
                journal_entry=entry,
                account=cheque.bank_account,
                debit=Decimal('0.00'),
                credit=cheque.amount,
                cost_center=cheque.cost_center,
                reference_type='cheque_register',
                reference_id=cheque.id,
            )

        cheque.status = 'cleared'
        cheque.save(update_fields=['status'])
        return entry
