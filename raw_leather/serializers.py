from rest_framework import serializers
from .models import LeatherSupplier, LeatherType, LeatherPurchaseOrder, LeatherPurchaseOrderLine

class LeatherSupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeatherSupplier
        fields = '__all__'
        read_only_fields = ('tenant',)

class LeatherTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeatherType
        fields = '__all__'
        read_only_fields = ('tenant',)

class LeatherPurchaseOrderLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeatherPurchaseOrderLine
        fields = '__all__'

class LeatherPurchaseOrderSerializer(serializers.ModelSerializer):
    lines = LeatherPurchaseOrderLineSerializer(many=True, read_only=True)

    class Meta:
        model = LeatherPurchaseOrder
        fields = '__all__'
        read_only_fields = ('tenant',)
