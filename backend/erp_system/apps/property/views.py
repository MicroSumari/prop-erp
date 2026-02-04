from rest_framework import viewsets, filters, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import (
    Property, Unit, Tenant, Lease, Maintenance, Expense, Rent,
    LeaseRenewal, LeaseTermination, RentalLegalCase, RentalLegalCaseStatusHistory
)
from .serializers import (
    PropertySerializer, UnitSerializer, TenantSerializer, LeaseSerializer,
    MaintenanceSerializer, ExpenseSerializer, RentSerializer,
    LeaseRenewalSerializer, LeaseTerminationSerializer,
    RentalLegalCaseSerializer, RentalLegalCaseStatusHistorySerializer
)
from .services import LeaseService, RentalLegalCaseService


class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.all()
    serializer_class = PropertySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'property_type', 'owner']
    search_fields = ['name', 'property_id', 'city']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']


class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['property', 'status']
    search_fields = ['unit_number']


class TenantViewSet(viewsets.ModelViewSet):
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['first_name', 'last_name', 'email']


class LeaseViewSet(viewsets.ModelViewSet):
    queryset = Lease.objects.all()
    serializer_class = LeaseSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'unit', 'tenant']
    search_fields = ['lease_number']

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            lease, journal_entry = LeaseService.create_lease(serializer.validated_data)
        except ValueError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        output_serializer = self.get_serializer(lease)
        data = output_serializer.data
        data['journal_entry_id'] = journal_entry.id
        headers = self.get_success_headers(data)
        return Response(data, status=status.HTTP_201_CREATED, headers=headers)


class MaintenanceViewSet(viewsets.ModelViewSet):
    queryset = Maintenance.objects.all()
    serializer_class = MaintenanceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'property']
    search_fields = ['maintenance_id', 'title']
    ordering_fields = ['reported_date', 'priority']


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['expense_type', 'payment_status', 'property']
    search_fields = ['expense_id', 'description']


class RentViewSet(viewsets.ModelViewSet):
    queryset = Rent.objects.all()
    serializer_class = RentSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'lease', 'tenant']
    ordering_fields = ['rent_date', 'due_date']


class LeaseRenewalViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Lease Renewal
    
    Extend existing lease with new terms (dates and rent).
    Reuses lease logic but with different dates and possibly new rent.
    """
    queryset = LeaseRenewal.objects.all()
    serializer_class = LeaseRenewalSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['original_lease', 'status']
    search_fields = ['renewal_number', 'original_lease__lease_number']
    ordering_fields = ['renewal_date', 'new_start_date']
    ordering = ['-renewal_date']
    
    def perform_create(self, serializer):
        """Generate renewal number on creation and validate"""
        # Validate the original lease can be renewed
        original_lease = serializer.validated_data.get('original_lease')
        new_start_date = serializer.validated_data.get('new_start_date')
        
        if original_lease.status == 'terminated':
            raise serializers.ValidationError({
                'original_lease': 'Cannot renew a terminated lease.'
            })
        
        # Validate new start date is after original end date
        if new_start_date <= original_lease.end_date:
            raise serializers.ValidationError({
                'new_start_date': f'New start date must be after the original lease end date ({original_lease.end_date}).'
            })
        
        renewal = serializer.save()
        if not renewal.renewal_number:
            count = LeaseRenewal.objects.filter(
                created_at__date=timezone.now().date()
            ).count()
            renewal.renewal_number = f"RN-{timezone.now().strftime('%Y%m%d')}-{count + 1:04d}"
            renewal.save()
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a lease renewal"""
        renewal = self.get_object()
        
        if renewal.status not in ['draft', 'pending_approval']:
            return Response(
                {'error': 'Only draft or pending approval renewals can be approved.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        renewal.status = 'approved'
        renewal.approval_date = timezone.now().date()
        renewal.save()
        
        serializer = self.get_serializer(renewal)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate an approved lease renewal (create new lease)"""
        renewal = self.get_object()
        
        if renewal.status != 'approved':
            return Response(
                {'error': 'Only approved renewals can be activated.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Create new lease with renewed terms
            original_lease = renewal.original_lease
            new_lease = Lease.objects.create(
                lease_number=f"{original_lease.lease_number}-REN",
                unit=original_lease.unit,
                tenant=original_lease.tenant,
                start_date=renewal.new_start_date,
                end_date=renewal.new_end_date,
                monthly_rent=renewal.new_monthly_rent,
                security_deposit=renewal.new_security_deposit or original_lease.security_deposit,
                status='active',
                terms_conditions=renewal.terms_conditions or original_lease.terms_conditions,
            )
            
            # End original lease
            original_lease.status = 'expired'
            original_lease.save()
            
            # Update renewal status
            renewal.status = 'active'
            renewal.activation_date = timezone.now().date()
            renewal.save()
            
            serializer = self.get_serializer(renewal)
            return Response({
                'renewal': serializer.data,
                'new_lease_id': new_lease.id,
                'message': 'Renewal activated and new lease created'
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a lease renewal"""
        renewal = self.get_object()
        renewal.status = 'rejected'
        renewal.save()
        
        serializer = self.get_serializer(renewal)
        return Response(serializer.data)


class LeaseTerminationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Lease Termination
    
    Handles both normal and early termination with comprehensive accounting:
    
    Normal Termination:
    - Debit: Refundable Security Deposit
    - Credit: Maintenance Charges + Tenant Account
    
    Early Termination:
    - Debit: Unearned Revenue + Refundable Security Deposit
    - Credit: Penalty + Maintenance + Post-Dated Cheques + Tenant Account
    """
    queryset = LeaseTermination.objects.all()
    serializer_class = LeaseTerminationSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['lease', 'termination_type', 'status']
    search_fields = ['termination_number', 'lease__lease_number']
    ordering_fields = ['termination_date', 'created_at']
    ordering = ['-termination_date']
    
    def perform_create(self, serializer):
        """Generate termination number and calculate net refund with validation"""
        # Validate the lease can be terminated
        lease = serializer.validated_data.get('lease')
        
        if lease.status == 'terminated':
            raise serializers.ValidationError({
                'lease': 'Cannot terminate an already terminated lease.'
            })
        
        if lease.status == 'expired':
            raise serializers.ValidationError({
                'lease': 'Cannot terminate an expired lease. Lease has already ended.'
            })
        
        termination = serializer.save()
        if not termination.termination_number:
            count = LeaseTermination.objects.filter(
                created_at__date=timezone.now().date()
            ).count()
            termination.termination_number = f"TERM-{timezone.now().strftime('%Y%m%d')}-{count + 1:04d}"
        termination.calculate_net_refund()
        termination.save()
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a termination request"""
        termination = self.get_object()
        
        if termination.status not in ['draft', 'pending_approval']:
            return Response(
                {'error': 'Only draft or pending approval terminations can be approved.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        termination.status = 'approved'
        termination.approval_date = timezone.now().date()
        termination.save()
        
        serializer = self.get_serializer(termination)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Complete the termination (process refund/charges)"""
        termination = self.get_object()
        
        if termination.status != 'approved':
            return Response(
                {'error': 'Only approved terminations can be completed.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Update lease status
            termination.lease.status = 'terminated'
            termination.lease.save()
            
            # Update tenant move-out date
            if termination.lease.tenant:
                termination.lease.tenant.move_out_date = termination.termination_date
                termination.lease.tenant.save()
            
            # Mark termination as completed
            termination.status = 'completed'
            termination.completion_date = timezone.now().date()
            termination.save()
            
            # Return summary
            serializer = self.get_serializer(termination)
            return Response({
                'termination': serializer.data,
                'accounting_entries': {
                    'type': termination.termination_type,
                    'net_refund': float(termination.net_refund),
                    'message': 'Refund' if termination.net_refund > 0 else 'Charge'
                }
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def create_early_termination(self, request):
        """Helper endpoint to create early termination with auto-calculated values"""
        lease_id = request.data.get('lease_id')
        termination_date = request.data.get('termination_date')
        
        if not lease_id or not termination_date:
            return Response(
                {'error': 'lease_id and termination_date are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            lease = Lease.objects.get(id=lease_id)
            
            # Calculate unearned rent
            from datetime import datetime
            term_date = datetime.strptime(termination_date, '%Y-%m-%d').date()
            days_remaining = (lease.end_date - term_date).days
            if days_remaining > 0:
                unearned_rent = (lease.monthly_rent / 30) * days_remaining
            else:
                unearned_rent = 0
            
            # Create termination
            termination = LeaseTermination.objects.create(
                lease=lease,
                termination_type='early',
                termination_date=term_date,
                original_security_deposit=lease.security_deposit,
                refundable_amount=lease.security_deposit,
                unearned_rent=unearned_rent,
                status='draft'
            )
            
            count = LeaseTermination.objects.filter(
                created_at__date=timezone.now().date()
            ).count()
            termination.termination_number = f"TERM-{timezone.now().strftime('%Y%m%d')}-{count + 1:04d}"
            termination.calculate_net_refund()
            termination.save()
            
            serializer = self.get_serializer(termination)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Lease.DoesNotExist:
            return Response(
                {'error': 'Lease not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class RentalLegalCaseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Rental Legal Cases
    
    Tracks legal cases against tenants with automatic unit status updates.
    NO accounting entries are created.
    """
    queryset = RentalLegalCase.objects.all()
    serializer_class = RentalLegalCaseSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tenant', 'lease', 'property', 'unit', 'case_type', 'current_status']
    search_fields = ['case_number', 'court_name']
    ordering_fields = ['filing_date', 'created_at']
    ordering = ['-filing_date']
    
    def perform_create(self, serializer):
        """Create legal case using service"""
        try:
            # Get created_by from request user
            created_by = ''
            if self.request.user and self.request.user.is_authenticated:
                created_by = self.request.user.username
            
            legal_case = RentalLegalCaseService.create_case(
                serializer.validated_data,
                created_by=created_by
            )
            
            # Update serializer instance
            serializer.instance = legal_case
        except ValueError as exc:
            raise serializers.ValidationError({'error': str(exc)})
    
    def perform_update(self, serializer):
        """Update legal case (non-status fields only)"""
        try:
            legal_case = self.get_object()
            updated_case = RentalLegalCaseService.update_case(
                legal_case,
                serializer.validated_data
            )
            serializer.instance = updated_case
        except ValueError as exc:
            raise serializers.ValidationError({'error': str(exc)})
    
    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        """
        Change legal case status with validation.
        
        POST /api/legal-cases/{id}/change_status/
        Body: {
            "new_status": "in_progress",
            "change_reason": "Court hearing scheduled"
        }
        """
        legal_case = self.get_object()
        new_status = request.data.get('new_status')
        change_reason = request.data.get('change_reason', '')
        
        if not new_status:
            return Response(
                {'error': 'new_status is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get changed_by from request user
            changed_by = ''
            if request.user and request.user.is_authenticated:
                changed_by = request.user.username
            
            updated_case = RentalLegalCaseService.change_status(
                legal_case,
                new_status,
                change_reason=change_reason,
                changed_by=changed_by
            )
            
            serializer = self.get_serializer(updated_case)
            return Response(serializer.data)
        except ValueError as exc:
            return Response(
                {'error': str(exc)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def by_tenant(self, request):
        """Get all legal cases for a specific tenant"""
        tenant_id = request.query_params.get('tenant_id')
        if not tenant_id:
            return Response(
                {'error': 'tenant_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cases = self.queryset.filter(tenant_id=tenant_id)
        serializer = self.get_serializer(cases, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_unit(self, request):
        """Get all legal cases for a specific unit"""
        unit_id = request.query_params.get('unit_id')
        if not unit_id:
            return Response(
                {'error': 'unit_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cases = self.queryset.filter(unit_id=unit_id)
        serializer = self.get_serializer(cases, many=True)
        return Response(serializer.data)
