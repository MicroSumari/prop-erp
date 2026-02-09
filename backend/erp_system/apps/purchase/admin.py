from django.contrib import admin
from .models import PurchaseOrder, SupplierInvoice, PaymentVoucher


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ['po_number', 'vendor', 'po_date', 'total_amount', 'status']
    list_filter = ['status', 'po_date']
    search_fields = ['po_number', 'vendor']


@admin.register(SupplierInvoice)
class SupplierInvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'supplier', 'invoice_date', 'total_amount', 'status']
    list_filter = ['status', 'invoice_date']
    search_fields = ['invoice_number', 'supplier__first_name', 'supplier__last_name']


@admin.register(PaymentVoucher)
class PaymentVoucherAdmin(admin.ModelAdmin):
    list_display = ['voucher_number', 'supplier', 'payment_date', 'amount', 'status']
    list_filter = ['status', 'payment_date', 'payment_method']
    search_fields = ['voucher_number', 'supplier__first_name', 'supplier__last_name']
