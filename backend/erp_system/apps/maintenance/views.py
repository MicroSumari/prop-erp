from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import MaintenanceRequest, MaintenanceContract
from .serializers import MaintenanceRequestSerializer, MaintenanceContractSerializer
from .services import MaintenanceRequestService, MaintenanceContractService
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

class MaintenanceRequestPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class MaintenanceRequestViewSet(viewsets.ModelViewSet):
    queryset = MaintenanceRequest.objects.all()
    serializer_class = MaintenanceRequestSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = MaintenanceRequestPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['request_type', 'status']
    search_fields = ['id', 'unit__unit_number']
    
    # Default ordering
    ordering = ['-created_at']

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        maintenance_request = MaintenanceRequestService.create_request(serializer.validated_data, request.user)
        response_serializer = self.get_serializer(maintenance_request)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class MaintenanceContractViewSet(viewsets.ModelViewSet):
    queryset = MaintenanceContract.objects.all()
    serializer_class = MaintenanceContractSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = MaintenanceRequestPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    
    filterset_fields = ['status']
    search_fields = [
        'id',
        'supplier__first_name',
        'supplier__last_name',
    ]
    
    # Default ordering
    ordering = ['-created_at']

    # Override get_queryset for better search
    def get_queryset(self):
        queryset = super().get_queryset()
        search_query = self.request.query_params.get('search', None)
        
        if search_query:
            # Build a flexible search query
            query = Q()
            
            # Search by contract ID (exact match or contains)
            try:
                search_id = int(search_query)
                query |= Q(id=search_id)
            except ValueError:
                # If not a number, search as text
                query |= Q(id__icontains=search_query)
            
            # Search by supplier name
            query |= Q(supplier__first_name__icontains=search_query)
            query |= Q(supplier__last_name__icontains=search_query)
            
            # If Property model has a name/identifier field, add it
            # Uncomment if Property has a name field
            # query |= Q(property__name__icontains=search_query)
            
            # If Unit model has a unit_number field, add it
            # query |= Q(unit__unit_number__icontains=search_query)
            
            queryset = queryset.filter(query).distinct()
        
        return queryset.select_related('supplier', 'property', 'unit', 'cost_center')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        contract = MaintenanceContractService.create_contract(serializer.validated_data)
        response_serializer = self.get_serializer(contract)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        contract = self.get_object()
        MaintenanceContractService.activate_contract(contract)
        serializer = self.get_serializer(contract)
        return Response(serializer.data, status=status.HTTP_200_OK)