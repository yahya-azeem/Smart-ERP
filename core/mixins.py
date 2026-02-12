from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied

class TenantDataMixin:
    """
    Mixin to filter QuerySet based on the user's Tenant
    and inject Tenant into created objects.
    """
    def get_queryset(self):
        # Ensure the viewset has a base queryset defined
        queryset = super().get_queryset()
        user = self.request.user

        # Superusers can see everything (optional, useful for debugging)
        if user.is_superuser:
            return queryset

        # Check if user has a tenant
        if not hasattr(user, 'tenant_user'):
            raise PermissionDenied("User is not associated with any Tenant.")

        # Filter by the user's tenant
        return queryset.filter(tenant=user.tenant_user.tenant)

    def perform_create(self, serializer):
        user = self.request.user
        if not hasattr(user, 'tenant_user') and not user.is_superuser:
             raise PermissionDenied("User is not associated with any Tenant.")
        
        # Automatically assign the tenant
        if hasattr(user, 'tenant_user'):
            serializer.save(tenant=user.tenant_user.tenant)
        else:
            # Fallback for superuser creating items (might need manual input or error)
            # For now, let's assume superusers provide it or it fails validation if required
            serializer.save()
