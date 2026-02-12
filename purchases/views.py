from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from rest_framework.exceptions import PermissionDenied
from .models import Vendor, PurchaseOrder, PurchaseOrderLine
from .serializers import VendorSerializer, PurchaseOrderSerializer, PurchaseOrderLineSerializer
from core.mixins import TenantDataMixin

class VendorViewSet(TenantDataMixin, viewsets.ModelViewSet):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer

class PurchaseOrderViewSet(TenantDataMixin, viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all()
    serializer_class = PurchaseOrderSerializer

    @action(detail=True, methods=['post'])
    def receive(self, request, pk=None):
        order = self.get_object()
        if order.status != 'ORDERED':
            return Response({"error": "Only ORDERED orders can be received."}, status=400)

        with transaction.atomic():
            # Increase Stock
            for line in order.lines.all():
                product = line.product
                product.stock_quantity += line.quantity
                product.save()

            order.status = 'RECEIVED'
            order.save()

        return Response({"status": "Stock received and inventory updated"})

class PurchaseOrderLineViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrderLine.objects.all()
    serializer_class = PurchaseOrderLineSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.is_superuser: return queryset
        if not hasattr(user, 'tenant_user'): raise PermissionDenied("No Tenant.")
        return queryset.filter(order__tenant=user.tenant_user.tenant)
    
    def perform_create(self, serializer):
        serializer.save()