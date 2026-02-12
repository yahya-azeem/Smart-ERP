from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from django.db import transaction
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Customer, SalesOrder, SalesOrderLine
from .serializers import CustomerSerializer, SalesOrderSerializer, SalesOrderLineSerializer
from accounting.models import Invoice
from core.mixins import TenantDataMixin

class CustomerViewSet(TenantDataMixin, viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

class SalesOrderViewSet(TenantDataMixin, viewsets.ModelViewSet):
    queryset = SalesOrder.objects.all()
    serializer_class = SalesOrderSerializer

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        order = self.get_object()
        if order.status != 'DRAFT':
            return Response({"error": "Only DRAFT orders can be confirmed."}, status=400)

        with transaction.atomic():
            # 1. Check Stock Levels
            for line in order.lines.select_related('product').all():
                if line.product.stock_quantity < line.quantity:
                    return Response(
                        {"error": f"Insufficient stock for {line.product.name} (Requested: {line.quantity}, Available: {line.product.stock_quantity})"},
                        status=400
                    )

            # 2. Deduct Stock
            for line in order.lines.select_related('product').all():
                product = line.product
                product.stock_quantity -= line.quantity
                product.save()

            # 3. Update Order Status
            order.status = 'CONFIRMED'
            order.save()

            # 4. Create Invoice
            invoice = Invoice.objects.create(
                tenant=order.tenant,
                customer=order.customer,
                sales_order=order,
                invoice_number=f"INV-{order.order_number}",
                date=timezone.now().date(),
                due_date=timezone.now().date() + timezone.timedelta(days=30),
                total_amount=order.total_amount,
                status='DRAFT'
            )

        return Response({
            "status": "Order confirmed and invoice created",
            "invoice_number": invoice.invoice_number
        })

class SalesOrderLineViewSet(viewsets.ModelViewSet):
    queryset = SalesOrderLine.objects.all()
    serializer_class = SalesOrderLineSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.is_superuser: return queryset
        if not hasattr(user, 'tenant_user'): raise PermissionDenied("No Tenant.")
        return queryset.filter(order__tenant=user.tenant_user.tenant)
    
    def perform_create(self, serializer):
        # We don't use the Mixin here because Lines don't have a direct 'tenant' field
        # Instead, we rely on the related 'order' to enforce tenancy
        serializer.save()
