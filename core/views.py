from rest_framework import viewsets
from .models import Product
from .serializers import ProductSerializer
from .mixins import TenantDataMixin

class ProductViewSet(TenantDataMixin, viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
