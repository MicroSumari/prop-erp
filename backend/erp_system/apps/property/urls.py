from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PropertyViewSet, UnitViewSet, TenantViewSet, LeaseViewSet,
    MaintenanceViewSet, ExpenseViewSet, RentViewSet,
    LeaseRenewalViewSet, LeaseTerminationViewSet, RentalLegalCaseViewSet
)

router = DefaultRouter()
router.register(r'properties', PropertyViewSet, basename='property')
router.register(r'units', UnitViewSet, basename='unit')
router.register(r'related-parties', TenantViewSet, basename='tenant')
router.register(r'leases', LeaseViewSet, basename='lease')
router.register(r'lease-renewals', LeaseRenewalViewSet, basename='lease-renewal')
router.register(r'lease-terminations', LeaseTerminationViewSet, basename='lease-termination')
router.register(r'legal-cases', RentalLegalCaseViewSet, basename='legal-case')
router.register(r'maintenance', MaintenanceViewSet, basename='maintenance')
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'rent', RentViewSet, basename='rent')

urlpatterns = [
    path('', include(router.urls)),
]
