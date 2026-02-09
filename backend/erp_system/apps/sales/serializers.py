from rest_framework import serializers
from .models import SalesOrder, ReceiptVoucher, CustomerInvoice
from erp_system.apps.property.models import Tenant


class SalesOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesOrder
        fields = '__all__'


class TenantNestedSerializer(serializers.ModelSerializer):
    """Nested Tenant serializer for Receipt Voucher"""
    class Meta:
        model = Tenant
        fields = ['id', 'first_name', 'last_name', 'email', 'phone']
        read_only_fields = ['id']


class ReceiptVoucherSerializer(serializers.ModelSerializer):
    tenant_details = TenantNestedSerializer(source='tenant', read_only=True)
    
    class Meta:
        model = ReceiptVoucher
        fields = [
            'id', 'receipt_number', 'tenant', 'tenant_details', 
            'lease',
            'payment_date', 'amount', 'payment_method',
            'bank_name', 'cheque_number', 'cheque_date',
            'status', 'cleared_date', 'description', 'notes',
            'cash_account', 'bank_account', 'post_dated_cheques_account',
            'tenant_account', 'cost_center', 'accounting_posted',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'receipt_number', 'created_at', 'updated_at', 'tenant_details']
        extra_kwargs = {
            'bank_name': {'required': False, 'allow_blank': True, 'allow_null': True},
            'cheque_number': {'required': False, 'allow_blank': True, 'allow_null': True},
            'cheque_date': {'required': False, 'allow_null': True},
            'cleared_date': {'required': False, 'allow_null': True},
            'description': {'required': False, 'allow_blank': True},
            'notes': {'required': False, 'allow_blank': True},
        }
    
    def validate(self, data):
        """Validate payment method specific fields"""
        payment_method = data.get('payment_method')
        
        # If payment method is bank or cheque, bank_name is required
        if payment_method in ['bank', 'cheque', 'post_dated_cheque']:
            if not data.get('bank_name'):
                raise serializers.ValidationError(
                    "Bank name is required for bank and cheque payments."
                )
        
        # If payment method is cheque or post-dated cheque, cheque_number is required
        if payment_method in ['cheque', 'post_dated_cheque']:
            if not data.get('cheque_number'):
                raise serializers.ValidationError(
                    "Cheque number is required for cheque payments."
                )
            if not data.get('cheque_date'):
                raise serializers.ValidationError(
                    "Cheque date is required for cheque payments."
                )
        
        return data


class CustomerInvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerInvoice
        fields = '__all__'

    def validate(self, data):
        if data.get('is_taxable') and not data.get('tax_account'):
            raise serializers.ValidationError('Tax account is required for taxable invoices.')
        return data
