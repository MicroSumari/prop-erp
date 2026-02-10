from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import PurchaseOrder, SupplierInvoice, PaymentVoucher
from .serializers import PurchaseOrderSerializer, SupplierInvoiceSerializer, PaymentVoucherSerializer
from .services import SupplierInvoiceService, PaymentVoucherService
from erp_system.apps.accounts.models import ChequeRegister
from erp_system.apps.accounts.services import ChequeRegisterService
from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.pagination import PageNumberPagination

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all()
    serializer_class = PurchaseOrderSerializer

class CustomPageNumberPagination(PageNumberPagination):
    page_size_query_param = 'page_size'
    max_page_size = 100


class SupplierInvoiceViewSet(viewsets.ModelViewSet):
    queryset = SupplierInvoice.objects.all()
    serializer_class = SupplierInvoiceSerializer
    pagination_class = CustomPageNumberPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['supplier', 'status', 'invoice_date']
    search_fields = ['invoice_number', 'supplier__first_name', 'supplier__last_name']
    ordering_fields = ['invoice_date', 'due_date', 'amount', 'created_at']
    ordering = ['-invoice_date']  # Default ordering

    def perform_create(self, serializer):
        invoice = serializer.save()
        if invoice.status in ['submitted', 'paid']:
            SupplierInvoiceService.post_supplier_invoice(invoice)


from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class PaymentVoucherViewSet(viewsets.ModelViewSet):
    queryset = PaymentVoucher.objects.all()
    serializer_class = PaymentVoucherSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # Define filters
    filterset_fields = {
        'status': ['exact'],
        'payment_method': ['exact'],
        'payment_date': ['gte', 'lte', 'exact'],
        'supplier__first_name': ['icontains'],
        'supplier__last_name': ['icontains'],
    }
    
    # Define search fields
    search_fields = [
        'voucher_number',
        'supplier__first_name',
        'supplier__last_name',
        'description',
    ]
    
    # Define ordering fields
    ordering_fields = [
        'voucher_number',
        'payment_date',
        'amount',
        'supplier__first_name',
        'created_at',
    ]
    ordering = ['-payment_date']

    def perform_create(self, serializer):
        voucher = serializer.save()
        if voucher.status in ['submitted', 'cleared']:
            PaymentVoucherService.post_payment_voucher(voucher)

        if voucher.payment_method == 'cheque':
            ChequeRegister.objects.create(
                cheque_type='outgoing',
                cheque_number=voucher.voucher_number,
                cheque_date=voucher.payment_date,
                amount=voucher.amount,
                bank_name='',
                status='received',
                payment_voucher=voucher,
                cheques_issued_account=voucher.cheques_issued_account,
                bank_account=voucher.bank_account,
                cost_center=voucher.cost_center,
            )

    @action(detail=True, methods=['post'])
    def mark_cleared(self, request, pk=None):
        voucher = self.get_object()
        if voucher.payment_method != 'cheque':
            return Response({'error': 'Only cheque payments can be cleared.'}, status=status.HTTP_400_BAD_REQUEST)

        cheque = voucher.cheque_registers.first()
        if not cheque:
            return Response({'error': 'Cheque register entry not found.'}, status=status.HTTP_404_NOT_FOUND)

        ChequeRegisterService.mark_cleared(cheque)
        voucher.status = 'cleared'
        voucher.save(update_fields=['status'])

        return Response(self.get_serializer(voucher).data)
