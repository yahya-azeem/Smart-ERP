from rest_framework import viewsets
from .models import Tenant
from .serializers import TenantSerializer

class TenantViewSet(viewsets.ModelViewSet):
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return self.queryset
        if hasattr(user, 'tenant_user'):
            return self.queryset.filter(id=user.tenant_user.tenant.id)
        return self.queryset.none()
