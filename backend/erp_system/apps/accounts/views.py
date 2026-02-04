from rest_framework import viewsets
from .models import Account, CostCenter, JournalEntry, JournalLine
from .serializers import AccountSerializer, CostCenterSerializer, JournalEntrySerializer, JournalLineSerializer


class AccountViewSet(viewsets.ModelViewSet):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer


class CostCenterViewSet(viewsets.ModelViewSet):
    queryset = CostCenter.objects.all()
    serializer_class = CostCenterSerializer


class JournalEntryViewSet(viewsets.ModelViewSet):
    queryset = JournalEntry.objects.all()
    serializer_class = JournalEntrySerializer


class JournalLineViewSet(viewsets.ModelViewSet):
    queryset = JournalLine.objects.all()
    serializer_class = JournalLineSerializer
