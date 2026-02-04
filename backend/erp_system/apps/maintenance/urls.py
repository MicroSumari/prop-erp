from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MaintenanceRequestViewSet, MaintenanceContractViewSet

router = DefaultRouter()
router.register(r'requests', MaintenanceRequestViewSet, basename='maintenance-request')
router.register(r'contracts', MaintenanceContractViewSet, basename='maintenance-contract')

urlpatterns = [
    path('', include(router.urls)),
]
