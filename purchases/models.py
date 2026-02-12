from django.db import models
from core.models import BaseModel, Product
from tenants.models import Tenant

class Vendor(BaseModel):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='vendors')
    name = models.CharField(max_length=255)
    email = models.EmailField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    contact_person = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        unique_together = ('tenant', 'name')

    def __str__(self):
        return self.name

class PurchaseOrder(BaseModel):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('ORDERED', 'Ordered'),
        ('RECEIVED', 'Received'),
        ('CANCELLED', 'Cancelled'),
    ]

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='purchase_orders')
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='purchase_orders')
    order_number = models.CharField(max_length=50)
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')

    class Meta:
        unique_together = ('tenant', 'order_number')

    def __str__(self):
        return f"{self.order_number} - {self.vendor.name}"

    @property
    def total_amount(self):
        return sum(line.total_price for line in self.lines.all())

class PurchaseOrderLine(BaseModel):
    order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='lines')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='purchase_order_lines')
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    def save(self, *args, **kwargs):
        if not self.unit_price and self.product:
            self.unit_price = self.product.cost_price
        super().save(*args, **kwargs)

    @property
    def total_price(self):
        return self.quantity * self.unit_price

    def __str__(self):
        return f"{self.order.order_number} - {self.product.name}"
