from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import SalesOrder, ReceiptVoucher
from .serializers import SalesOrderSerializer, ReceiptVoucherSerializer
from erp_system.apps.property.models import Tenant


class SalesOrderViewSet(viewsets.ModelViewSet):
    queryset = SalesOrder.objects.all()
    serializer_class = SalesOrderSerializer


class ReceiptVoucherViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Receipt Vouchers
    
    Handles tenant payments received in cash, bank transfer, cheque, or post-dated cheques.
    Debit: Cash / Bank / Post-Dated Cheques
    Credit: Tenant (Customer) Account
    """
    queryset = ReceiptVoucher.objects.all()
    serializer_class = ReceiptVoucherSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tenant', 'payment_method', 'status', 'payment_date']
    search_fields = ['receipt_number', 'tenant__first_name', 'tenant__last_name', 'cheque_number']
    ordering_fields = ['payment_date', 'amount', 'created_at']
    ordering = ['-payment_date']
    
    def perform_create(self, serializer):
        """Generate receipt number on creation"""
        receipt = serializer.save()
        if not receipt.receipt_number:
            # Auto-generate receipt number if not provided
            from django.utils import timezone
            count = ReceiptVoucher.objects.filter(
                created_at__date=timezone.now().date()
            ).count()
            receipt.receipt_number = f"RV-{timezone.now().strftime('%Y%m%d')}-{count + 1:04d}"
            receipt.save()
    
    @action(detail=True, methods=['post'])
    def mark_cleared(self, request, pk=None):
        """Mark a cheque or bank transfer as cleared"""
        receipt = self.get_object()
        
        if receipt.payment_method not in ['cheque', 'post_dated_cheque', 'bank']:
            return Response(
                {'error': 'Only cheque and bank transfers can be marked as cleared.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from django.utils import timezone
        receipt.status = 'cleared'
        receipt.cleared_date = timezone.now().date()
        receipt.save()
        
        serializer = self.get_serializer(receipt)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_bounced(self, request, pk=None):
        """Mark a cheque as bounced"""
        receipt = self.get_object()
        
        if receipt.payment_method not in ['cheque', 'post_dated_cheque']:
            return Response(
                {'error': 'Only cheques can be marked as bounced.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        receipt.status = 'bounced'
        receipt.save()
        
        serializer = self.get_serializer(receipt)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_tenant(self, request):
        """Get all receipt vouchers for a specific tenant"""
        tenant_id = request.query_params.get('tenant_id')
        if not tenant_id:
            return Response(
                {'error': 'tenant_id parameter is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            tenant = Tenant.objects.get(id=tenant_id)
        except Tenant.DoesNotExist:
            return Response(
                {'error': 'Tenant not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        receipts = ReceiptVoucher.objects.filter(tenant=tenant)
        serializer = self.get_serializer(receipts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get summary statistics for receipt vouchers"""
        total_receipts = ReceiptVoucher.objects.count()
        total_amount = sum([r.amount for r in ReceiptVoucher.objects.filter(status='cleared')])
        
        by_method = {}
        for method, label in ReceiptVoucher._meta.get_field('payment_method').choices:
            by_method[label] = ReceiptVoucher.objects.filter(payment_method=method).count()
        
        by_status = {}
        for status_choice, label in ReceiptVoucher._meta.get_field('status').choices:
            by_status[label] = ReceiptVoucher.objects.filter(status=status_choice).count()
        
        return Response({
            'total_receipts': total_receipts,
            'total_amount_cleared': float(total_amount),
            'by_payment_method': by_method,
            'by_status': by_status,
        })
