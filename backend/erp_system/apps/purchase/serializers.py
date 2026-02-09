from rest_framework import serializers
from .models import PurchaseOrder, SupplierInvoice, PaymentVoucher


class PurchaseOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrder
        fields = '__all__'


class SupplierInvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupplierInvoice
        fields = '__all__'

    def validate(self, data):
        if data.get('is_taxable') and not data.get('tax_account'):
            raise serializers.ValidationError('Tax account is required for taxable supplier invoices.')
        return data


class PaymentVoucherSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentVoucher
        fields = '__all__'

    def validate(self, data):
        method = data.get('payment_method')
        if method == 'cash' and not data.get('cash_account'):
            raise serializers.ValidationError('Cash account is required for cash payments.')
        if method == 'bank' and not data.get('bank_account'):
            raise serializers.ValidationError('Bank account is required for bank payments.')
        if method == 'cheque' and not data.get('cheques_issued_account'):
            raise serializers.ValidationError('Cheques issued account is required for cheque payments.')
        return data
