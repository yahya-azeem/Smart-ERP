from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.db.models import Sum, Count, F
from django.db.models.functions import TruncMonth
from .models import Invoice, Payment
from .serializers import InvoiceSerializer, PaymentSerializer
from core.mixins import TenantDataMixin
from core.models import Product
from sales.models import SalesOrder

class InvoiceViewSet(TenantDataMixin, viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer

class PaymentViewSet(TenantDataMixin, viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer

class DashboardView(APIView):
    def get(self, request):
        user = request.user
        if not hasattr(user, 'tenant_user') and not user.is_superuser:
            raise PermissionDenied("User is not associated with any Tenant.")
        
        tenant = user.tenant_user.tenant if hasattr(user, 'tenant_user') else None
        
        # Base QuerySets (Filtered by Tenant)
        if tenant:
            invoices = Invoice.objects.filter(tenant=tenant)
            products = Product.objects.filter(tenant=tenant)
            orders = SalesOrder.objects.filter(tenant=tenant)
        else:
            # Superuser view (all data or empty, let's show all for now)
            invoices = Invoice.objects.all()
            products = Product.objects.all()
            orders = SalesOrder.objects.all()

        # 1. Financial Metrics
        total_revenue = invoices.filter(status='PAID').aggregate(sum=Sum('total_amount'))['sum'] or 0
        pending_income = invoices.filter(status__in=['SENT', 'PARTIALLY_PAID', 'OVERDUE']).aggregate(sum=Sum('total_amount'))['sum'] or 0
        
        # Calculate actually paid amount from partial payments is harder with just Invoice status
        # Better to sum Payments directly for "Cash Collected"
        if tenant:
            collected_cash = Payment.objects.filter(tenant=tenant).aggregate(sum=Sum('amount'))['sum'] or 0
        else:
            collected_cash = Payment.objects.aggregate(sum=Sum('amount'))['sum'] or 0

        # 2. Inventory Metrics
        total_products = products.count()
        low_stock_products = products.filter(stock_quantity__lt=5).values('name', 'stock_quantity')[:5]

        # 3. Sales Performance (Orders by Status)
        order_stats = orders.values('status').annotate(count=Count('id'))

        # 4. Monthly Sales (Last 12 months usually, doing all time for simplicity)
        monthly_sales = orders.filter(status='CONFIRMED').annotate(
            month=TruncMonth('date')
        ).values('month').annotate(
            total=Sum(F('lines__unit_price') * F('lines__quantity'))
        ).order_by('month')

        data = {
            "financials": {
                "total_revenue_invoiced": total_revenue,
                "cash_collected": collected_cash,
                "pending_income": pending_income
            },
            "inventory": {
                "total_sku_count": total_products,
                "low_stock_items": list(low_stock_products)
            },
            "sales_overview": {
                "orders_by_status": list(order_stats),
                "monthly_sales_trend": list(monthly_sales)
            }
        }
        
        return Response(data)
