use serde::{Deserialize, Serialize};
use sqlx::types::Uuid;
use rust_decimal::Decimal;
use chrono::{DateTime, NaiveDate, Utc};
use strum::{Display, EnumString};
use async_trait::async_trait;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Supplier {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub contact_person: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSupplier {
    pub name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub contact_person: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, EnumString, Display, sqlx::Type)]
#[sqlx(type_name = "purchase_order_status", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum PurchaseOrderStatus {
    #[strum(serialize = "DRAFT")]
    Draft,
    #[strum(serialize = "ORDERED")]
    Ordered,
    #[strum(serialize = "RECEIVED")]
    Received,
    #[strum(serialize = "CANCELLED")]
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct PurchaseOrder {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub supplier_id: Uuid,
    pub order_number: String,
    pub date: NaiveDate,
    pub status: PurchaseOrderStatus,
    pub total_amount: Decimal,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct PurchaseOrderLine {
    pub id: Uuid,
    pub order_id: Uuid,
    pub product_id: Uuid,
    pub quantity: Decimal,
    pub unit_price: Decimal,
    pub total_price: Decimal, // Generated in DB, but good to have in struct
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePurchaseOrderLine {
    pub product_id: Uuid,
    pub quantity: Decimal,
    pub unit_price: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePurchaseOrder {
    pub supplier_id: Uuid,
    pub order_number: String,
    pub date: NaiveDate,
    pub lines: Vec<CreatePurchaseOrderLine>,
}

#[async_trait]
pub trait PurchasingService: Send + Sync {
    async fn create_supplier(&self, tenant_id: Uuid, supplier: CreateSupplier) -> Result<Supplier, crate::error::Error>;
    
    async fn create_order(
        &self,
        tenant_id: Uuid,
        order: CreatePurchaseOrder,
    ) -> Result<PurchaseOrder, crate::error::Error>;

    /// Receives a Purchase Order.
    /// This must:
    /// 1. Validate status is ORDERED.
    /// 2. Update status to RECEIVED.
    /// 3. Create Inventory Transactions (PURCHASE) for all lines.
    /// 4. Update Product Stock.
    async fn receive_order(&self, tenant_id: Uuid, order_id: Uuid) -> Result<PurchaseOrder, crate::error::Error>;
}
