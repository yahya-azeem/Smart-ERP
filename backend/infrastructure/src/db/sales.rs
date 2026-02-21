use async_trait::async_trait;
use smart_erp_core::models::sales::{
    CreateCustomer, CreateSalesOrder, Customer, SalesOrder, SalesOrderLine, SalesOrderStatus,
    SalesService,
};
use smart_erp_core::models::inventory::TransactionType;
use smart_erp_core::error::Error;
use sqlx::{PgPool, Postgres, Transaction};
use uuid::Uuid;

pub struct PostgresSalesRepository {
    pool: PgPool,
}

impl PostgresSalesRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl SalesService for PostgresSalesRepository {
    async fn create_customer(
        &self,
        tenant_id: Uuid,
        customer: CreateCustomer,
    ) -> Result<Customer, Error> {
        let record = sqlx::query_as::<_, Customer>(
            r#"
            INSERT INTO customers (tenant_id, name, email, phone, address)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            "#
        )
        .bind(tenant_id)
        .bind(customer.name)
        .bind(customer.email)
        .bind(customer.phone)
        .bind(customer.address)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Error::Database(e.to_string()))?;

        Ok(record)
    }

    async fn create_order(
        &self,
        tenant_id: Uuid,
        order: CreateSalesOrder,
    ) -> Result<SalesOrder, Error> {
        let mut tx: Transaction<'_, Postgres> = self.pool.begin().await.map_err(|e| Error::Database(e.to_string()))?;

        let total_amount: rust_decimal::Decimal = order.lines.iter()
            .map(|line| line.quantity * line.unit_price)
            .sum();

        let so = sqlx::query_as::<_, SalesOrder>(
            r#"
            INSERT INTO sales_orders (tenant_id, customer_id, order_number, date, total_amount, status)
            VALUES ($1, $2, $3, $4, $5, 'DRAFT')
            RETURNING id, tenant_id, customer_id, order_number, date, status, total_amount, created_at, updated_at
            "#
        )
        .bind(tenant_id)
        .bind(order.customer_id)
        .bind(order.order_number)
        .bind(order.date)
        .bind(total_amount)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| Error::Database(e.to_string()))?;

        for line in order.lines {
            sqlx::query(
                r#"
                INSERT INTO sales_order_lines (order_id, product_id, quantity, unit_price)
                VALUES ($1, $2, $3, $4)
                "#
            )
            .bind(so.id)
            .bind(line.product_id)
            .bind(line.quantity)
            .bind(line.unit_price)
            .execute(&mut *tx)
            .await
            .map_err(|e| Error::Database(e.to_string()))?;
        }

        tx.commit().await.map_err(|e| Error::Database(e.to_string()))?;

        Ok(so)
    }

    async fn ship_order(&self, tenant_id: Uuid, order_id: Uuid) -> Result<SalesOrder, Error> {
        let mut tx: Transaction<'_, Postgres> = self.pool.begin().await.map_err(|e| Error::Database(e.to_string()))?;

        let order = sqlx::query_as::<_, SalesOrder>(
            r#"
            SELECT id, tenant_id, customer_id, order_number, date, status, total_amount, created_at, updated_at
            FROM sales_orders
            WHERE id = $1 AND tenant_id = $2
            FOR UPDATE
            "#
        )
        .bind(order_id)
        .bind(tenant_id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| Error::Database(e.to_string()))?
        .ok_or(Error::NotFound("Sales Order not found".to_string()))?;

        if order.status != SalesOrderStatus::Confirmed {
            return Err(Error::BusinessRule(format!(
                "Cannot ship order with status {:?}. Must be CONFIRMED.",
                order.status
            )));
        }

        let updated_order = sqlx::query_as::<_, SalesOrder>(
            r#"
            UPDATE sales_orders
            SET status = 'SHIPPED', updated_at = NOW()
            WHERE id = $1
            RETURNING id, tenant_id, customer_id, order_number, date, status, total_amount, created_at, updated_at
            "#
        )
        .bind(order_id)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| Error::Database(e.to_string()))?;

        let lines = sqlx::query_as::<_, SalesOrderLine>(
            r#"
            SELECT id, order_id, product_id, quantity, unit_price, total_price
            FROM sales_order_lines
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
            .bind(TransactionType::Sale)
            .bind(order_id)
            .bind(format!("Shipped SO {}", order.order_number))
            .execute(&mut *tx)
            .await
            .map_err(|e| Error::Database(e.to_string()))?;

            sqlx::query(
                r#"
                UPDATE products
                SET stock_quantity = stock_quantity - $1, updated_at = NOW()
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

    async fn get_sales_trend(&self, tenant_id: Uuid) -> Result<Vec<smart_erp_core::models::analytics::SalesTrend>, Error> {
        let records = sqlx::query_as::<_, smart_erp_core::models::analytics::SalesTrend>(
            r#"
            SELECT TO_CHAR(date, 'Mon') as month, SUM(total_amount) as amount
            FROM sales_orders
            WHERE tenant_id = $1 AND status != 'CANCELLED'
            GROUP BY 1, date_trunc('month', date)
            ORDER BY date_trunc('month', date)
            LIMIT 12
            "#
        )
        .bind(tenant_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Error::Database(e.to_string()))?;

        Ok(records)
    }
}
