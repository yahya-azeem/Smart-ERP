use serde::{Deserialize, Serialize};
use sqlx::types::Uuid;
use rust_decimal::Decimal;
use chrono::{DateTime, NaiveDate, Utc};
use strum::{Display, EnumString};
use async_trait::async_trait;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Customer {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCustomer {
    pub name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, EnumString, Display, sqlx::Type)]
#[sqlx(type_name = "sales_order_status", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum SalesOrderStatus {
    #[strum(serialize = "DRAFT")]
    Draft,
    #[strum(serialize = "CONFIRMED")]
    Confirmed,
    #[strum(serialize = "SHIPPED")]
    Shipped,
    #[strum(serialize = "CANCELLED")]
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct SalesOrder {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub customer_id: Uuid,
    pub order_number: String,
    pub date: NaiveDate,
    pub status: SalesOrderStatus,
    pub total_amount: Decimal,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct SalesOrderLine {
    pub id: Uuid,
    pub order_id: Uuid,
    pub product_id: Uuid,
    pub quantity: Decimal,
    pub unit_price: Decimal,
    pub total_price: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSalesOrderLine {
    pub product_id: Uuid,
    pub quantity: Decimal,
    pub unit_price: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSalesOrder {
    pub customer_id: Uuid,
    pub order_number: String,
    pub date: NaiveDate,
    pub lines: Vec<CreateSalesOrderLine>,
}

use crate::models::analytics::SalesTrend;

#[async_trait]
pub trait SalesService: Send + Sync {
    async fn create_customer(
        &self,
        tenant_id: Uuid,
        customer: CreateCustomer,
    ) -> Result<Customer, crate::error::Error>;

    async fn create_order(
        &self,
        tenant_id: Uuid,
        order: CreateSalesOrder,
    ) -> Result<SalesOrder, crate::error::Error>;

    /// Ships a Sales Order.
    /// This must:
    /// 1. Validate status is CONFIRMED.
    /// 2. Update status to SHIPPED.
    /// 3. Create Inventory Transactions (SALE) for all lines.
    /// 4. Update Product Stock (Decrement).
    async fn ship_order(&self, tenant_id: Uuid, order_id: Uuid) -> Result<SalesOrder, crate::error::Error>;

    async fn get_sales_trend(&self, tenant_id: Uuid) -> Result<Vec<SalesTrend>, crate::error::Error>;
}
