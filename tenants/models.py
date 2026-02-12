from django.db import models
from django.contrib.auth.models import User
from core.models import BaseModel

class Tenant(BaseModel):
    name = models.CharField(max_length=255, unique=True)
    address = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class TenantUser(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='tenant_user')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='users')

    def __str__(self):
        return f"{self.user.username} - {self.tenant.name}"