"""
URL configuration for smart project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from tenants.views import TenantViewSet
from core.views import ProductViewSet
from sales.views import CustomerViewSet, SalesOrderViewSet, SalesOrderLineViewSet
from purchases.views import VendorViewSet, PurchaseOrderViewSet, PurchaseOrderLineViewSet
from accounting.views import InvoiceViewSet, PaymentViewSet, DashboardView
from raw_leather.views import (
    LeatherSupplierViewSet, 
    LeatherTypeViewSet, 
    LeatherPurchaseOrderViewSet, 
    LeatherPurchaseOrderLineViewSet
)

router = DefaultRouter()
router.register(r'tenants', TenantViewSet)
router.register(r'products', ProductViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'sales-orders', SalesOrderViewSet)
router.register(r'sales-order-lines', SalesOrderLineViewSet)
router.register(r'vendors', VendorViewSet)
router.register(r'purchase-orders', PurchaseOrderViewSet)
router.register(r'purchase-order-lines', PurchaseOrderLineViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'leather-suppliers', LeatherSupplierViewSet)
router.register(r'leather-types', LeatherTypeViewSet)
router.register(r'leather-purchase-orders', LeatherPurchaseOrderViewSet)
router.register(r'leather-purchase-order-lines', LeatherPurchaseOrderLineViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/dashboard/', DashboardView.as_view(), name='dashboard'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]