from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from rest_framework.exceptions import PermissionDenied
from .models import LeatherSupplier, LeatherType, LeatherPurchaseOrder, LeatherPurchaseOrderLine
from .serializers import (
    LeatherSupplierSerializer, 
    LeatherTypeSerializer, 
    LeatherPurchaseOrderSerializer, 
    LeatherPurchaseOrderLineSerializer
)
from core.mixins import TenantDataMixin

class LeatherSupplierViewSet(TenantDataMixin, viewsets.ModelViewSet):
    queryset = LeatherSupplier.objects.all()
    serializer_class = LeatherSupplierSerializer

class LeatherTypeViewSet(TenantDataMixin, viewsets.ModelViewSet):
    queryset = LeatherType.objects.all()
    serializer_class = LeatherTypeSerializer

class LeatherPurchaseOrderViewSet(TenantDataMixin, viewsets.ModelViewSet):
    queryset = LeatherPurchaseOrder.objects.all()
    serializer_class = LeatherPurchaseOrderSerializer

    @action(detail=True, methods=['post'])
    def receive(self, request, pk=None):
        order = self.get_object()
        if order.status != 'ORDERED':
            return Response({"error": "Only ORDERED orders can be received."}, status=400)

        with transaction.atomic():
            order.status = 'RECEIVED'
            order.save()

        return Response({"status": "Leather order received successfully"})

class LeatherPurchaseOrderLineViewSet(viewsets.ModelViewSet):
    queryset = LeatherPurchaseOrderLine.objects.all()
    serializer_class = LeatherPurchaseOrderLineSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.is_superuser:
            return queryset
        if not hasattr(user, 'tenant_user'):
            raise PermissionDenied("No Tenant.")
        return queryset.filter(order__tenant=user.tenant_user.tenant)

    def perform_create(self, serializer):
        serializer.save()
