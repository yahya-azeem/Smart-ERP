from rest_framework import serializers
from .models import Customer, SalesOrder, SalesOrderLine

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'
        read_only_fields = ('tenant',)

class SalesOrderLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesOrderLine
        fields = '__all__'
        # Lines don't have a direct tenant field usually, but if they did...
        # They link to Order.

class SalesOrderSerializer(serializers.ModelSerializer):
    lines = SalesOrderLineSerializer(many=True, read_only=True)

    class Meta:
        model = SalesOrder
        fields = '__all__'
        read_only_fields = ('tenant',)