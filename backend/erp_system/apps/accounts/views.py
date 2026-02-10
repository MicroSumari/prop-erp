from django.db.models import Sum
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import (
    Account,
    CostCenter,
    JournalEntry,
    JournalLine,
    ChequeRegister,
    TransactionAccountMapping,
    PropertyClassification,
    ReceiptPaymentMapping,
)
from .serializers import (
    AccountSerializer,
    CostCenterSerializer,
    JournalEntrySerializer,
    JournalLineSerializer,
    ChequeRegisterSerializer,
    ManualJournalEntrySerializer,
    TransactionAccountMappingSerializer,
    PropertyClassificationSerializer,
    ReceiptPaymentMappingSerializer,
)


class AccountViewSet(viewsets.ModelViewSet):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer


class CostCenterViewSet(viewsets.ModelViewSet):
    queryset = CostCenter.objects.all()
    serializer_class = CostCenterSerializer


class JournalEntryViewSet(viewsets.ModelViewSet):
    queryset = JournalEntry.objects.all()
    serializer_class = JournalEntrySerializer


class JournalLineViewSet(viewsets.ModelViewSet):
    queryset = JournalLine.objects.all()
    serializer_class = JournalLineSerializer

    @action(detail=False, methods=['get'])
    def trial_balance(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        lines = JournalLine.objects.select_related('journal_entry', 'account')
        if start_date:
            lines = lines.filter(journal_entry__entry_date__gte=start_date)
        if end_date:
            lines = lines.filter(journal_entry__entry_date__lte=end_date)

        summary = lines.values(
            'account__id',
            'account__account_number',
            'account__account_name',
            'account__account_type',
        ).annotate(
            total_debit=Sum('debit'),
            total_credit=Sum('credit'),
        ).order_by('account__account_number')

        return Response(list(summary))

    @action(detail=False, methods=['get'])
    def general_ledger(self, request):
        account_id = request.query_params.get('account_id')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        lines = JournalLine.objects.select_related('journal_entry', 'account', 'cost_center')
        if account_id:
            lines = lines.filter(account_id=account_id)
        if start_date:
            lines = lines.filter(journal_entry__entry_date__gte=start_date)
        if end_date:
            lines = lines.filter(journal_entry__entry_date__lte=end_date)

        data = [
            {
                'entry_id': line.journal_entry_id,
                'entry_date': line.journal_entry.entry_date,
                'entry_type': line.journal_entry.entry_type,
                'reference_type': line.reference_type,
                'reference_id': line.reference_id,
                'account_id': line.account_id,
                'account_number': line.account.account_number,
                'account_name': line.account.account_name,
                'debit': float(line.debit),
                'credit': float(line.credit),
                'cost_center': line.cost_center.code,
            }
            for line in lines.order_by('journal_entry__entry_date', 'id')
        ]

        return Response(data)


class ChequeRegisterViewSet(viewsets.ModelViewSet):
    queryset = ChequeRegister.objects.all()
    serializer_class = ChequeRegisterSerializer

    @action(detail=True, methods=['post'])
    def mark_cleared(self, request, pk=None):
        cheque = self.get_object()
        from .services import ChequeRegisterService
        ChequeRegisterService.mark_cleared(cheque)
        return Response(self.get_serializer(cheque).data)


class ManualJournalEntryViewSet(viewsets.ViewSet):
    serializer_class = ManualJournalEntrySerializer

    def create(self, request):
        if not request.user or not request.user.is_staff:
            return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = ManualJournalEntrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        entry = serializer.save()
        return Response(JournalEntrySerializer(entry).data, status=status.HTTP_201_CREATED)


class TransactionAccountMappingViewSet(viewsets.ModelViewSet):
    queryset = TransactionAccountMapping.objects.all()
    serializer_class = TransactionAccountMappingSerializer


class PropertyClassificationViewSet(viewsets.ModelViewSet):
    queryset = PropertyClassification.objects.all()
    serializer_class = PropertyClassificationSerializer


class ReceiptPaymentMappingViewSet(viewsets.ModelViewSet):
    queryset = ReceiptPaymentMapping.objects.all()
    serializer_class = ReceiptPaymentMappingSerializer
