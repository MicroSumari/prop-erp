from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import MaintenanceRequest, MaintenanceContract
from .serializers import MaintenanceRequestSerializer, MaintenanceContractSerializer
from .services import MaintenanceRequestService, MaintenanceContractService


class MaintenanceRequestViewSet(viewsets.ModelViewSet):
    queryset = MaintenanceRequest.objects.all()
    serializer_class = MaintenanceRequestSerializer
    permission_classes = [IsAuthenticated]

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
