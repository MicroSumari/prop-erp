from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.pagination import PageNumberPagination
from django.db.models import Sum, Q  # ADD Q here
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
class CustomPageNumberPagination(PageNumberPagination):
    page_size_query_param = 'page_size'
    max_page_size = 100

class AccountViewSet(viewsets.ModelViewSet):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    pagination_class = CustomPageNumberPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['account_type', 'is_active']
    search_fields = ['account_number', 'account_name', 'description']
    ordering_fields = ['account_number', 'account_name', 'created_at']
    ordering = ['account_number']


class CostCenterViewSet(viewsets.ModelViewSet):
    queryset = CostCenter.objects.all()
    serializer_class = CostCenterSerializer


class JournalEntryViewSet(viewsets.ModelViewSet):
    queryset = JournalEntry.objects.all()
    serializer_class = JournalEntrySerializer


class TrialBalancePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class GeneralLedgerPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class JournalLineViewSet(viewsets.ModelViewSet):
    queryset = JournalLine.objects.all()
    serializer_class = JournalLineSerializer

    @action(detail=False, methods=['get'])
    def trial_balance(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        search_query = request.query_params.get('search', '')
        account_type = request.query_params.get('account_type', '')
        
        # Validate required dates
        if not start_date or not end_date:
            return Response(
                {'error': 'Both start_date and end_date are required parameters.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        lines = JournalLine.objects.select_related('journal_entry', 'account')
        
        # Date filters - using the related JournalEntry's entry_date
        if start_date:
            lines = lines.filter(journal_entry__entry_date__gte=start_date)
        if end_date:
            lines = lines.filter(journal_entry__entry_date__lte=end_date)
        
        # Account type filter
        if account_type:
            lines = lines.filter(account__account_type=account_type)
        
        # Search filter
        if search_query:
            lines = lines.filter(
                Q(account__account_number__icontains=search_query) |
                Q(account__account_name__icontains=search_query)
            ).distinct()
        
        # Debug: Check what data we're getting
        print(f"Date range: {start_date} to {end_date}")
        print(f"Total lines found: {lines.count()}")
        
        # Group by account and calculate totals
        summary = lines.values(
            'account__id',
            'account__account_number',
            'account__account_name',
            'account__account_type',
        ).annotate(
            total_debit=Sum('debit'),
            total_credit=Sum('credit'),
        ).order_by('account__account_number')
        
        # Calculate overall totals for the response
        total_debit = lines.aggregate(total=Sum('debit'))['total'] or 0
        total_credit = lines.aggregate(total=Sum('credit'))['total'] or 0
        
        # Pagination
        paginator = TrialBalancePagination()
        page = paginator.paginate_queryset(summary, request)
        
        if page is not None:
            response = paginator.get_paginated_response(page)
            # Add summary data to response
            response.data['summary'] = {
                'total_debit': float(total_debit),
                'total_credit': float(total_credit),
                'balance': float(total_debit - total_credit),
                'account_count': summary.count(),
                'date_range': {
                    'start_date': start_date,
                    'end_date': end_date
                }
            }
            return response
        
        # If no pagination, return all data
        data = list(summary)
        return Response({
            'results': data,
            'count': len(data),
            'summary': {
                'total_debit': float(total_debit),
                'total_credit': float(total_credit),
                'balance': float(total_debit - total_credit),
                'account_count': len(data),
                'date_range': {
                    'start_date': start_date,
                    'end_date': end_date
                }
            }
        })

    @action(detail=False, methods=['get'])
    def general_ledger(self, request):
        account_id = request.query_params.get('account_id')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        entry_type = request.query_params.get('entry_type')
        reference_type = request.query_params.get('reference_type')
        search_query = request.query_params.get('search', '')

        lines = JournalLine.objects.select_related('journal_entry', 'account', 'cost_center')
        
        # Account filter
        if account_id:
            lines = lines.filter(account_id=account_id)
        
        # Date filters
        if start_date:
            lines = lines.filter(journal_entry__entry_date__gte=start_date)
        if end_date:
            lines = lines.filter(journal_entry__entry_date__lte=end_date)
        
        # Entry type filter
        if entry_type:
            lines = lines.filter(journal_entry__entry_type=entry_type)
        
        # Reference type filter
        if reference_type:
            lines = lines.filter(reference_type=reference_type)
        
        # Search filter
        if search_query:
            lines = lines.filter(
                Q(account__account_number__icontains=search_query) |
                Q(account__account_name__icontains=search_query) |
                Q(reference_type__icontains=search_query) |
                Q(journal_entry__entry_type__icontains=search_query)
            ).distinct()
        
        # Order by date and ID
        lines = lines.order_by('journal_entry__entry_date', 'id')
        
        # Calculate totals
        total_debit = lines.aggregate(total=Sum('debit'))['total'] or 0
        total_credit = lines.aggregate(total=Sum('credit'))['total'] or 0
        
        # Pagination
        paginator = GeneralLedgerPagination()
        page = paginator.paginate_queryset(lines, request)
        
        if page is not None:
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
                    'cost_center': line.cost_center.code if line.cost_center else None,
                }
                for line in page
            ]
            response = paginator.get_paginated_response(data)
            response.data['summary'] = {
                'total_debit': float(total_debit),
                'total_credit': float(total_credit),
                'balance': float(total_debit - total_credit),
                'entry_count': lines.count()
            }
            return response
        
        # If no pagination, return all data
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
                'cost_center': line.cost_center.code if line.cost_center else None,
            }
            for line in lines
        ]
        
        return Response({
            'results': data,
            'count': len(data),
            'summary': {
                'total_debit': float(total_debit),
                'total_credit': float(total_credit),
                'balance': float(total_debit - total_credit),
                'entry_count': len(data)
            }
        })

class ChequeRegisterViewSet(viewsets.ModelViewSet):
    queryset = ChequeRegister.objects.select_related('payment_voucher', 'receipt_voucher')
    serializer_class = ChequeRegisterSerializer
    pagination_class = CustomPageNumberPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    filterset_fields = [
        'cheque_type',
        'status',
        'bank_name',
    ]
    
    search_fields = [
        'cheque_number',
        'bank_name',
    ]
    
    ordering_fields = [
        'cheque_number',
        'cheque_date',
        'amount',
        'created_at',
        'updated_at',
    ]
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        search_query = self.request.query_params.get('search', None)
        
        if not search_query:
            return queryset
        
        # Filter in memory for related fields
        filtered_ids = []
        for cheque in queryset:
            matches_search = (
                search_query.lower() in (cheque.cheque_number or '').lower() or
                search_query.lower() in (cheque.bank_name or '').lower() or
                (cheque.payment_voucher and search_query.lower() in (cheque.payment_voucher.voucher_number or '').lower()) or
                (cheque.receipt_voucher and search_query.lower() in (cheque.receipt_voucher.voucher_number or '').lower())
            )
            if matches_search:
                filtered_ids.append(cheque.id)
        
        return queryset.filter(id__in=filtered_ids)

    @action(detail=True, methods=['post'])
    def mark_cleared(self, request, pk=None):
        cheque = self.get_object()
        from .services import ChequeRegisterService
        ChequeRegisterService.mark_cleared(cheque)
        return Response(self.get_serializer(cheque).data)
    
    @action(detail=True, methods=['post'])
    def mark_deposited(self, request, pk=None):
        cheque = self.get_object()
        if cheque.status != 'received':
            return Response({'error': 'Only received cheques can be marked as deposited.'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        cheque.status = 'deposited'
        cheque.save(update_fields=['status'])
        return Response(self.get_serializer(cheque).data)
    
    @action(detail=True, methods=['post'])
    def mark_bounced(self, request, pk=None):
        cheque = self.get_object()
        if cheque.status != 'cleared':
            return Response({'error': 'Only cleared cheques can be marked as bounced.'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        cheque.status = 'bounced'
        cheque.save(update_fields=['status'])
        return Response(self.get_serializer(cheque).data)

class ManualJournalEntryViewSet(viewsets.ModelViewSet):  # Change from ViewSet to ModelViewSet
    queryset = JournalEntry.objects.filter(entry_type='manual')  # Filter only manual entries
    serializer_class = JournalEntrySerializer  # Use JournalEntrySerializer for all operations
    pagination_class = CustomPageNumberPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # Define filters
    filterset_fields = [
        'entry_date',
        'created_at',
    ]
    
    # Define search fields
    search_fields = [
        'description',
        'lines__account__account_number',
        'lines__account__account_name',
    ]
    
    # Define ordering fields
    ordering_fields = [
        'id',
        'entry_date',
        'created_at',
        'updated_at',
    ]
    ordering = ['-entry_date']

    def get_serializer_class(self):
        """Use different serializer for create vs list/retrieve"""
        if self.action == 'create':
            return ManualJournalEntrySerializer
        return JournalEntrySerializer

    def create(self, request):
        """Override create to check permissions and use ManualJournalEntrySerializer"""
        if not request.user or not request.user.is_staff:
            return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = ManualJournalEntrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        entry = serializer.save()
        return Response(JournalEntrySerializer(entry).data, status=status.HTTP_201_CREATED)
    
    def get_queryset(self):
        """Override queryset to include related data for better performance"""
        queryset = super().get_queryset()
        return queryset.select_related().prefetch_related('lines', 'lines__account', 'lines__cost_center')


class TransactionAccountMappingViewSet(viewsets.ModelViewSet):
    queryset = TransactionAccountMapping.objects.all()
    serializer_class = TransactionAccountMappingSerializer


class PropertyClassificationViewSet(viewsets.ModelViewSet):
    queryset = PropertyClassification.objects.all()
    serializer_class = PropertyClassificationSerializer


class ReceiptPaymentMappingViewSet(viewsets.ModelViewSet):
    queryset = ReceiptPaymentMapping.objects.all()
    serializer_class = ReceiptPaymentMappingSerializer
