from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import PurchaseOrder, SupplierInvoice, PaymentVoucher
from .serializers import PurchaseOrderSerializer, SupplierInvoiceSerializer, PaymentVoucherSerializer
from .services import SupplierInvoiceService, PaymentVoucherService
from erp_system.apps.accounts.models import ChequeRegister
from erp_system.apps.accounts.services import ChequeRegisterService


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all()
    serializer_class = PurchaseOrderSerializer


class SupplierInvoiceViewSet(viewsets.ModelViewSet):
    queryset = SupplierInvoice.objects.all()
    serializer_class = SupplierInvoiceSerializer

    def perform_create(self, serializer):
        invoice = serializer.save()
        if invoice.status in ['submitted', 'paid']:
            SupplierInvoiceService.post_supplier_invoice(invoice)


class PaymentVoucherViewSet(viewsets.ModelViewSet):
    queryset = PaymentVoucher.objects.all()
    serializer_class = PaymentVoucherSerializer

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
