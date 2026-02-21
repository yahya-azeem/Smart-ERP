use async_trait::async_trait;
use smart_erp_core::models::product::{CreateProduct, Product, ProductService};
use smart_erp_core::error::Error;
use sqlx::PgPool;
use uuid::Uuid;

pub struct PostgresProductRepository {
    pool: PgPool,
}

impl PostgresProductRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl ProductService for PostgresProductRepository {
    async fn create_product(
        &self,
        tenant_id: Uuid,
        product: CreateProduct,
    ) -> Result<Product, Error> {
        let record = sqlx::query_as::<_, Product>(
            r#"
            INSERT INTO products (tenant_id, name, sku, description, unit_of_measure, price, cost_price)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, tenant_id, name, sku, description, unit_of_measure, price, cost_price, stock_quantity, created_at, updated_at
            "#
        )
        .bind(tenant_id)
        .bind(product.name)
        .bind(product.sku)
        .bind(product.description)
        .bind(product.unit_of_measure)
        .bind(product.price)
        .bind(product.cost_price)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Error::Database(e.to_string()))?;

        Ok(record)
    }

    async fn list_products(&self, tenant_id: Uuid) -> Result<Vec<Product>, Error> {
        let records = sqlx::query_as::<_, Product>(
            r#"
            SELECT id, tenant_id, name, sku, description, unit_of_measure, price, cost_price, stock_quantity, created_at, updated_at
            FROM products
            WHERE tenant_id = $1
            ORDER BY name
            "#
        )
        .bind(tenant_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Error::Database(e.to_string()))?;

        Ok(records)
    }

    async fn get_product(&self, tenant_id: Uuid, product_id: Uuid) -> Result<Product, Error> {
        let record = sqlx::query_as::<_, Product>(
            r#"
            SELECT id, tenant_id, name, sku, description, unit_of_measure, price, cost_price, stock_quantity, created_at, updated_at
            FROM products
            WHERE id = $1 AND tenant_id = $2
            "#
        )
        .bind(product_id)
        .bind(tenant_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Error::Database(e.to_string()))?
        .ok_or(Error::NotFound("Product not found".to_string()))?;

        Ok(record)
    }
}
