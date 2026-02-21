use async_trait::async_trait;
use smart_erp_core::models::inventory::{
    CreateInventoryTransaction, InventoryService, InventoryTransaction,
};
use smart_erp_core::error::Error;
use rust_decimal::Decimal;
use sqlx::{PgPool, Postgres, Transaction};
use uuid::Uuid;

pub struct PostgresInventoryRepository {
    pool: PgPool,
}

impl PostgresInventoryRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl InventoryService for PostgresInventoryRepository {
    async fn record_transaction(
        &self,
        tenant_id: Uuid,
        transaction: CreateInventoryTransaction,
    ) -> Result<InventoryTransaction, Error> {
        let mut tx: Transaction<'_, Postgres> = self.pool.begin().await.map_err(|e| Error::Database(e.to_string()))?;

        let record = sqlx::query_as::<_, InventoryTransaction>(
            r#"
            INSERT INTO inventory_transactions 
            (tenant_id, product_id, quantity, transaction_type, reference_id, notes)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, tenant_id, product_id, quantity, transaction_type, reference_id, notes, created_at
            "#
        )
        .bind(tenant_id)
        .bind(transaction.product_id)
        .bind(transaction.quantity)
        .bind(transaction.transaction_type)
        .bind(transaction.reference_id)
        .bind(transaction.notes)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| Error::Database(e.to_string()))?;

        sqlx::query(
            r#"
            UPDATE products 
            SET stock_quantity = stock_quantity + $1, updated_at = NOW()
            WHERE id = $2 AND tenant_id = $3
            "#
        )
        .bind(transaction.quantity)
        .bind(transaction.product_id)
        .bind(tenant_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| Error::Database(e.to_string()))?;

        tx.commit().await.map_err(|e| Error::Database(e.to_string()))?;

        Ok(record)
    }

    async fn get_stock_level(&self, tenant_id: Uuid, product_id: Uuid) -> Result<Decimal, Error> {
        let row = sqlx::query(
            r#"
            SELECT stock_quantity 
            FROM products 
            WHERE id = $1 AND tenant_id = $2
            "#
        )
        .bind(product_id)
        .bind(tenant_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Error::Database(e.to_string()))?;

        if let Some(row) = row {
            use sqlx::Row;
            Ok(row.try_get("stock_quantity").unwrap_or_default())
        } else {
            Err(Error::NotFound("Product not found".to_string()))
        }
    }
}
