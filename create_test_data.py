#!/usr/bin/env python
"""
Script to populate the ERP database with test data
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smart.settings')
django.setup()

from django.contrib.auth.models import User
from tenants.models import Tenant, TenantUser
from core.models import Product
from sales.models import Customer, SalesOrder, SalesOrderLine
from purchases.models import Vendor, PurchaseOrder, PurchaseOrderLine
from accounting.models import Invoice, Payment
from decimal import Decimal
from datetime import date, timedelta
import random

print("Creating test data for Smart ERP...")
print("="*50)

# Get or create tenant
tenant, created = Tenant.objects.get_or_create(
    name="Demo Company Inc.",
    defaults={
        'address': '123 Business Ave, Suite 100, New York, NY 10001'
    }
)
print(f"✓ Tenant: {tenant.name} {'(created)' if created else '(exists)'}")

# Get admin user and link to tenant
admin_user = User.objects.get(username='admin')
tenant_user, created = TenantUser.objects.get_or_create(
    user=admin_user,
    defaults={'tenant': tenant}
)
if not created:
    tenant_user.tenant = tenant
    tenant_user.save()
print(f"✓ Linked admin user to tenant")

# Create Products
products_data = [
    {'name': 'Laptop Computer', 'sku': 'TECH-001', 'price': 999.99, 'cost_price': 650.00, 'stock_quantity': 50},
    {'name': 'Wireless Mouse', 'sku': 'TECH-002', 'price': 29.99, 'cost_price': 12.00, 'stock_quantity': 200},
    {'name': 'Mechanical Keyboard', 'sku': 'TECH-003', 'price': 149.99, 'cost_price': 80.00, 'stock_quantity': 75},
    {'name': 'USB-C Hub', 'sku': 'TECH-004', 'price': 79.99, 'cost_price': 35.00, 'stock_quantity': 100},
    {'name': 'Monitor 27" 4K', 'sku': 'TECH-005', 'price': 449.99, 'cost_price': 280.00, 'stock_quantity': 30},
    {'name': 'Webcam HD', 'sku': 'TECH-006', 'price': 89.99, 'cost_price': 45.00, 'stock_quantity': 150},
    {'name': 'Desk Chair Ergonomic', 'sku': 'FURN-001', 'price': 299.99, 'cost_price': 150.00, 'stock_quantity': 25},
    {'name': 'Standing Desk', 'sku': 'FURN-002', 'price': 599.99, 'cost_price': 320.00, 'stock_quantity': 20},
    {'name': 'Desk Lamp LED', 'sku': 'FURN-003', 'price': 49.99, 'cost_price': 22.00, 'stock_quantity': 80},
    {'name': 'Filing Cabinet', 'sku': 'FURN-004', 'price': 199.99, 'cost_price': 95.00, 'stock_quantity': 40},
]

products = []
for prod_data in products_data:
    product, created = Product.objects.get_or_create(
        tenant=tenant,
        sku=prod_data['sku'],
        defaults={
            'name': prod_data['name'],
            'price': prod_data['price'],
            'cost_price': prod_data['cost_price'],
            'stock_quantity': prod_data['stock_quantity']
        }
    )
    products.append(product)
    if created:
        print(f"✓ Product: {product.name}")

print(f"\nTotal products: {len(products)}")

# Create Customers
customers_data = [
    {'name': 'Acme Corporation', 'email': 'orders@acme.com', 'phone': '555-0101', 'address': '100 Industry Blvd, Chicago, IL 60601'},
    {'name': 'TechStart Inc', 'email': 'procurement@techstart.io', 'phone': '555-0102', 'address': '500 Startup Way, San Francisco, CA 94105'},
    {'name': 'Global Solutions LLC', 'email': 'buying@globalsol.com', 'phone': '555-0103', 'address': '250 Enterprise Dr, Austin, TX 78701'},
    {'name': 'Innovate Labs', 'email': 'office@innovatelabs.co', 'phone': '555-0104', 'address': '75 Research Park, Boston, MA 02101'},
    {'name': 'Metro Retail Group', 'email': 'purchasing@metrorg.com', 'phone': '555-0105', 'address': '300 Commerce St, Miami, FL 33101'},
]

customers = []
for cust_data in customers_data:
    customer, created = Customer.objects.get_or_create(
        tenant=tenant,
        name=cust_data['name'],
        defaults={
            'email': cust_data['email'],
            'phone': cust_data['phone'],
            'address': cust_data['address']
        }
    )
    customers.append(customer)
    if created:
        print(f"✓ Customer: {customer.name}")

print(f"Total customers: {len(customers)}")

# Create Vendors
vendors_data = [
    {'name': 'TechSupply Co', 'email': 'sales@techsupply.com', 'phone': '555-0201', 'address': '1000 Warehouse Row, Dallas, TX 75201', 'contact_person': 'John Smith'},
    {'name': 'Office Furniture Plus', 'email': 'orders@ofp.com', 'phone': '555-0202', 'address': '200 Distribution Center, Atlanta, GA 30301', 'contact_person': 'Sarah Johnson'},
    {'name': 'Electronics Wholesale', 'email': 'bulk@elecwholesale.net', 'phone': '555-0203', 'address': '500 Tech Hub, Seattle, WA 98101', 'contact_person': 'Mike Chen'},
    {'name': 'Computer Components Ltd', 'email': 'sales@ccltd.com', 'phone': '555-0204', 'address': '150 Silicon Valley Blvd, San Jose, CA 95101', 'contact_person': 'Emily Rodriguez'},
]

vendors = []
for vend_data in vendors_data:
    vendor, created = Vendor.objects.get_or_create(
        tenant=tenant,
        name=vend_data['name'],
        defaults={
            'email': vend_data['email'],
            'phone': vend_data['phone'],
            'address': vend_data['address'],
            'contact_person': vend_data['contact_person']
        }
    )
    vendors.append(vendor)
    if created:
        print(f"✓ Vendor: {vendor.name}")

print(f"Total vendors: {len(vendors)}")

# Create Sales Orders
sales_orders_data = [
    {'order_number': 'SO-2025-001', 'customer': customers[0], 'status': 'CONFIRMED', 'date': date(2025, 1, 15)},
    {'order_number': 'SO-2025-002', 'customer': customers[1], 'status': 'DRAFT', 'date': date(2025, 1, 18)},
    {'order_number': 'SO-2025-003', 'customer': customers[2], 'status': 'CONFIRMED', 'date': date(2025, 1, 20)},
    {'order_number': 'SO-2025-004', 'customer': customers[3], 'status': 'CANCELLED', 'date': date(2025, 1, 22)},
    {'order_number': 'SO-2025-005', 'customer': customers[4], 'status': 'CONFIRMED', 'date': date(2025, 1, 25)},
    {'order_number': 'SO-2025-006', 'customer': customers[0], 'status': 'DRAFT', 'date': date(2025, 1, 28)},
]

sales_orders = []
for so_data in sales_orders_data:
    so, created = SalesOrder.objects.get_or_create(
        tenant=tenant,
        order_number=so_data['order_number'],
        defaults={
            'customer': so_data['customer'],
            'status': so_data['status'],
            'date': so_data['date']
        }
    )
    sales_orders.append(so)
    if created:
        print(f"✓ Sales Order: {so.order_number} - {so.customer.name}")

print(f"Total sales orders: {len(sales_orders)}")

# Create Sales Order Lines
print("\nCreating sales order lines...")
for i, so in enumerate(sales_orders):
    if so.status == 'CANCELLED':
        continue
    
    # Add 2-4 products to each order
    num_products = random.randint(2, 4)
    selected_products = random.sample(products, num_products)
    
    for j, product in enumerate(selected_products):
        quantity = random.randint(1, 10)
        SalesOrderLine.objects.get_or_create(
            order=so,
            product=product,
            defaults={
                'quantity': quantity,
                'unit_price': product.price
            }
        )
    
    print(f"✓ Added {num_products} items to {so.order_number} (Total: ${so.total_amount:.2f})")

# Create Purchase Orders
purchase_orders_data = [
    {'order_number': 'PO-2025-001', 'vendor': vendors[0], 'status': 'RECEIVED', 'date': date(2025, 1, 10)},
    {'order_number': 'PO-2025-002', 'vendor': vendors[1], 'status': 'ORDERED', 'date': date(2025, 1, 14)},
    {'order_number': 'PO-2025-003', 'vendor': vendors[2], 'status': 'DRAFT', 'date': date(2025, 1, 17)},
    {'order_number': 'PO-2025-004', 'vendor': vendors[3], 'status': 'RECEIVED', 'date': date(2025, 1, 21)},
    {'order_number': 'PO-2025-005', 'vendor': vendors[0], 'status': 'ORDERED', 'date': date(2025, 1, 24)},
]

purchase_orders = []
for po_data in purchase_orders_data:
    po, created = PurchaseOrder.objects.get_or_create(
        tenant=tenant,
        order_number=po_data['order_number'],
        defaults={
            'vendor': po_data['vendor'],
            'status': po_data['status'],
            'date': po_data['date']
        }
    )
    purchase_orders.append(po)
    if created:
        print(f"✓ Purchase Order: {po.order_number} - {po.vendor.name}")

print(f"Total purchase orders: {len(purchase_orders)}")

# Create Purchase Order Lines
print("\nCreating purchase order lines...")
for po in purchase_orders:
    # Add 3-5 products to each order
    num_products = random.randint(3, 5)
    selected_products = random.sample(products, num_products)
    
    for product in selected_products:
        quantity = random.randint(5, 20)
        PurchaseOrderLine.objects.get_or_create(
            order=po,
            product=product,
            defaults={
                'quantity': quantity,
                'unit_price': product.cost_price
            }
        )
    
    print(f"✓ Added {num_products} items to {po.order_number} (Total: ${po.total_amount:.2f})")

# Create Invoices (link to confirmed sales orders)
print("\nCreating invoices...")
confirmed_orders = [so for so in sales_orders if so.status == 'CONFIRMED']

invoices_data = [
    {'invoice_number': 'INV-2025-001', 'sales_order': confirmed_orders[0], 'status': 'PAID'},
    {'invoice_number': 'INV-2025-002', 'sales_order': confirmed_orders[1], 'status': 'PARTIALLY_PAID'},
    {'invoice_number': 'INV-2025-003', 'sales_order': confirmed_orders[2], 'status': 'SENT'},
    {'invoice_number': 'INV-2025-004', 'sales_order': None, 'status': 'DRAFT'},  # Standalone invoice
]

invoices = []
for inv_data in invoices_data:
    if inv_data['sales_order']:
        customer = inv_data['sales_order'].customer
        total = inv_data['sales_order'].total_amount
    else:
        customer = customers[0]
        total = Decimal('1250.00')
    
    invoice, created = Invoice.objects.get_or_create(
        tenant=tenant,
        invoice_number=inv_data['invoice_number'],
        defaults={
            'customer': customer,
            'sales_order': inv_data['sales_order'],
            'date': date(2025, 1, 15),
            'due_date': date(2025, 2, 15),
            'total_amount': total,
            'status': inv_data['status']
        }
    )
    invoices.append(invoice)
    if created:
        print(f"✓ Invoice: {invoice.invoice_number} - {invoice.customer.name} (${invoice.total_amount:.2f})")

print(f"Total invoices: {len(invoices)}")

# Create Payments
print("\nCreating payments...")
payments_data = [
    {'invoice': invoices[0], 'amount': invoices[0].total_amount, 'method': 'BANK', 'date': date(2025, 1, 20)},
    {'invoice': invoices[1], 'amount': invoices[1].total_amount * Decimal('0.5'), 'method': 'CREDIT_CARD', 'date': date(2025, 1, 22)},
    {'invoice': invoices[2], 'amount': invoices[2].total_amount * Decimal('0.25'), 'method': 'CASH', 'date': date(2025, 1, 23)},
]

for pay_data in payments_data:
    payment, created = Payment.objects.get_or_create(
        tenant=tenant,
        invoice=pay_data['invoice'],
        amount=pay_data['amount'],
        defaults={
            'date': pay_data['date'],
            'payment_method': pay_data['method'],
            'reference': f'PAY-{random.randint(1000, 9999)}'
        }
    )
    if created:
        status_after = pay_data['invoice'].status
        print(f"✓ Payment: ${pay_data['amount']:.2f} for {pay_data['invoice'].invoice_number} (Status: {status_after})")

print("\n" + "="*50)
print("Test data creation completed!")
print("="*50)
print("\nSummary:")
print(f"  • {len(products)} Products")
print(f"  • {len(customers)} Customers")
print(f"  • {len(vendors)} Vendors")
print(f"  • {len(sales_orders)} Sales Orders")
print(f"  • {len(purchase_orders)} Purchase Orders")
print(f"  • {len(invoices)} Invoices")
print(f"  • {len(payments_data)} Payments")
print(f"\nYou can now login at http://localhost:5173")
print("Username: admin | Password: admin123")
