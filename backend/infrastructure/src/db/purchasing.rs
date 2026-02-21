use async_trait::async_trait;
use smart_erp_core::models::purchasing::{
    CreatePurchaseOrder, CreateSupplier, PurchaseOrder, PurchaseOrderLine, PurchaseOrderStatus,
    PurchasingService, Supplier,
};
use smart_erp_core::models::inventory::TransactionType;
use smart_erp_core::error::Error;
use sqlx::{PgPool, Postgres, Transaction};
use uuid::Uuid;

pub struct PostgresPurchasingRepository {
    pool: PgPool,
}

impl PostgresPurchasingRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl PurchasingService for PostgresPurchasingRepository {
    async fn create_supplier(
        &self,
        tenant_id: Uuid,
        supplier: CreateSupplier,
    ) -> Result<Supplier, Error> {
        let record = sqlx::query_as::<_, Supplier>(
            r#"
            INSERT INTO suppliers (tenant_id, name, email, phone, address, contact_person)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            "#
        )
        .bind(tenant_id)
        .bind(supplier.name)
        .bind(supplier.email)
        .bind(supplier.phone)
        .bind(supplier.address)
        .bind(supplier.contact_person)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Error::Database(e.to_string()))?;

        Ok(record)
    }

    async fn create_order(
        &self,
        tenant_id: Uuid,
        order: CreatePurchaseOrder,
    ) -> Result<PurchaseOrder, Error> {
        let mut tx: Transaction<'_, Postgres> = self.pool.begin().await.map_err(|e| Error::Database(e.to_string()))?;

        let total_amount: rust_decimal::Decimal = order.lines.iter()
            .map(|line| line.quantity * line.unit_price)
            .sum();

        let po = sqlx::query_as::<_, PurchaseOrder>(
            r#"
            INSERT INTO purchase_orders (tenant_id, supplier_id, order_number, date, total_amount, status)
            VALUES ($1, $2, $3, $4, $5, 'DRAFT')
            RETURNING id, tenant_id, supplier_id, order_number, date, status, total_amount, created_at, updated_at
            "#
        )
        .bind(tenant_id)
        .bind(order.supplier_id)
        .bind(order.order_number)
        .bind(order.date)
        .bind(total_amount)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| Error::Database(e.to_string()))?;

        for line in order.lines {
            sqlx::query(
                r#"
                INSERT INTO purchase_order_lines (order_id, product_id, quantity, unit_price)
                VALUES ($1, $2, $3, $4)
                "#
            )
            .bind(po.id)
            .bind(line.product_id)
            .bind(line.quantity)
            .bind(line.unit_price)
            .execute(&mut *tx)
            .await
            .map_err(|e| Error::Database(e.to_string()))?;
        }

        tx.commit().await.map_err(|e| Error::Database(e.to_string()))?;

        Ok(po)
    }

    async fn receive_order(&self, tenant_id: Uuid, order_id: Uuid) -> Result<PurchaseOrder, Error> {
        let mut tx: Transaction<'_, Postgres> = self.pool.begin().await.map_err(|e| Error::Database(e.to_string()))?;

        let order = sqlx::query_as::<_, PurchaseOrder>(
            r#"
            SELECT id, tenant_id, supplier_id, order_number, date, status, total_amount, created_at, updated_at
            FROM purchase_orders
            WHERE id = $1 AND tenant_id = $2
            FOR UPDATE
            "#
        )
        .bind(order_id)
        .bind(tenant_id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| Error::Database(e.to_string()))?
        .ok_or(Error::NotFound("Purchase Order not found".to_string()))?;

        if order.status != PurchaseOrderStatus::Ordered {
            return Err(Error::BusinessRule(format!(
                "Cannot receive order with status {:?}. Must be ORDERED.",
                order.status
            )));
        }

        let updated_order = sqlx::query_as::<_, PurchaseOrder>(
            r#"
            UPDATE purchase_orders
            SET status = 'RECEIVED', updated_at = NOW()
            WHERE id = $1
            RETURNING id, tenant_id, supplier_id, order_number, date, status, total_amount, created_at, updated_at
            "#
        )
        .bind(order_id)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| Error::Database(e.to_string()))?;

        let lines = sqlx::query_as::<_, PurchaseOrderLine>(
            r#"
            SELECT id, order_id, product_id, quantity, unit_price, total_price
            FROM purchase_order_lines
            WHERE order_id = $1
            "#
        )
        .bind(order_id)
        .fetch_all(&mut *tx)
        .await
        .map_err(|e| Error::Database(e.to_string()))?;

        for line in lines {
            sqlx::query(
                r#"
                INSERT INTO inventory_transactions 
                (tenant_id, product_id, quantity, transaction_type, reference_id, notes)
                VALUES ($1, $2, $3, $4, $5, $6)
                "#
            )
            .bind(tenant_id)
            .bind(line.product_id)
            .bind(line.quantity)
            .bind(TransactionType::Purchase)
            .bind(order_id)
            .bind(format!("Received PO {}", order.order_number))
            .execute(&mut *tx)
            .await
            .map_err(|e| Error::Database(e.to_string()))?;

            sqlx::query(
                r#"
                UPDATE products
                SET stock_quantity = stock_quantity + $1, updated_at = NOW()
                WHERE id = $2 AND tenant_id = $3
                "#
            )
            .bind(line.quantity)
            .bind(line.product_id)
            .bind(tenant_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| Error::Database(e.to_string()))?;
        }

        tx.commit().await.map_err(|e| Error::Database(e.to_string()))?;

        Ok(updated_order)
    }
}
