from django.contrib import admin
from .models import PurchaseOrder


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ['po_number', 'vendor', 'po_date', 'total_amount', 'status']
    list_filter = ['status', 'po_date']
    search_fields = ['po_number', 'vendor']
