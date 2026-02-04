from django.contrib import admin
from .models import Item


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ['item_id', 'item_name', 'category', 'quantity_on_hand', 'cost_price', 'selling_price', 'is_active']
    list_filter = ['category', 'is_active']
    search_fields = ['item_id', 'item_name']
