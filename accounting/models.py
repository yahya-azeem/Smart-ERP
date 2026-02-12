from django.db import models
from core.models import BaseModel
from tenants.models import Tenant
from sales.models import Customer, SalesOrder

class Invoice(BaseModel):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SENT', 'Sent'),
        ('PAID', 'Paid'),
        ('PARTIALLY_PAID', 'Partially Paid'),
        ('OVERDUE', 'Overdue'),
        ('CANCELLED', 'Cancelled'),
    ]

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='invoices')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='invoices')
    sales_order = models.ForeignKey(SalesOrder, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    invoice_number = models.CharField(max_length=50)
    date = models.DateField()
    due_date = models.DateField()
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')

    class Meta:
        unique_together = ('tenant', 'invoice_number')

    def __str__(self):
        return f"{self.invoice_number} - {self.customer.name}"
    
    @property
    def amount_paid(self):
        return sum(payment.amount for payment in self.payments.all())

    @property
    def amount_due(self):
        return self.total_amount - self.amount_paid

class Payment(BaseModel):
    PAYMENT_METHOD_CHOICES = [
        ('CASH', 'Cash'),
        ('BANK', 'Bank Transfer'),
        ('CREDIT_CARD', 'Credit Card'),
        ('OTHER', 'Other'),
    ]

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='payments')
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='BANK')
    reference = models.CharField(max_length=100, blank=True, null=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update Invoice Status
        invoice = self.invoice
        total_paid = invoice.amount_paid
        
        if total_paid >= invoice.total_amount:
            invoice.status = 'PAID'
        elif total_paid > 0:
            invoice.status = 'PARTIALLY_PAID'
        else:
            invoice.status = 'SENT' # Or DRAFT depending on workflow, but usually if paying it's sent
        
        invoice.save()

    def __str__(self):
        return f"{self.invoice.invoice_number} - {self.amount}"
