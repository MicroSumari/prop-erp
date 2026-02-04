from django.contrib import admin
from .models import Account, CostCenter, JournalEntry, JournalLine


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ['account_number', 'account_name', 'account_type', 'is_active']
    list_filter = ['account_type', 'is_active']
    search_fields = ['account_number', 'account_name']


@admin.register(CostCenter)
class CostCenterAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'is_active']
    search_fields = ['code', 'name']


@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    list_display = ['entry_type', 'reference_type', 'reference_id', 'period', 'entry_date']
    list_filter = ['entry_type', 'period', 'entry_date']


@admin.register(JournalLine)
class JournalLineAdmin(admin.ModelAdmin):
    list_display = ['journal_entry', 'account', 'debit', 'credit', 'cost_center']
    list_filter = ['account', 'cost_center']
