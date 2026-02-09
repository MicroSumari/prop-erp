from django.contrib import admin
from .models import SalesOrder, ReceiptVoucher, CustomerInvoice


@admin.register(SalesOrder)
class SalesOrderAdmin(admin.ModelAdmin):
    list_display = ['so_number', 'customer', 'order_date', 'total_amount', 'status']
    list_filter = ['status', 'order_date']
    search_fields = ['so_number', 'customer']


@admin.register(ReceiptVoucher)
class ReceiptVoucherAdmin(admin.ModelAdmin):
    list_display = ['receipt_number', 'tenant', 'payment_date', 'amount', 'status']
    list_filter = ['status', 'payment_method', 'payment_date']
    search_fields = ['receipt_number', 'tenant__first_name', 'tenant__last_name']


@admin.register(CustomerInvoice)
class CustomerInvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'tenant', 'invoice_date', 'total_amount', 'status']
    list_filter = ['status', 'invoice_date']
    search_fields = ['invoice_number', 'tenant__first_name', 'tenant__last_name']
