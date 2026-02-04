from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AccountViewSet, CostCenterViewSet, JournalEntryViewSet, JournalLineViewSet

router = DefaultRouter()
router.register(r'accounts', AccountViewSet)
router.register(r'cost-centers', CostCenterViewSet)
router.register(r'journal-entries', JournalEntryViewSet)
router.register(r'journal-lines', JournalLineViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
