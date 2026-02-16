use serde::{Deserialize, Serialize};
use sqlx::types::Uuid;
use rust_decimal::Decimal;
use chrono::{DateTime, Utc};
use strum::{Display, EnumString};
use async_trait::async_trait;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, EnumString, Display, sqlx::Type)]
#[sqlx(type_name = "transaction_type", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TransactionType {
    #[strum(serialize = "PURCHASE")]
    Purchase,
    #[strum(serialize = "SALE")]
    Sale,
    #[strum(serialize = "ADJUSTMENT")]
    Adjustment,
    #[strum(serialize = "PRODUCTION_IN")]
    ProductionIn,
    #[strum(serialize = "PRODUCTION_OUT")]
    ProductionOut,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct InventoryTransaction {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub product_id: Uuid,
    pub quantity: Decimal,
    pub transaction_type: TransactionType,
    pub reference_id: Option<Uuid>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateInventoryTransaction {
    pub product_id: Uuid,
    pub quantity: Decimal,
    pub transaction_type: TransactionType,
    pub reference_id: Option<Uuid>,
    pub notes: Option<String>,
}

#[async_trait]
pub trait InventoryService: Send + Sync {
    /// Records a new inventory transaction and updates the product stock atomically.
    async fn record_transaction(
        &self,
        tenant_id: Uuid,
        transaction: CreateInventoryTransaction,
    ) -> Result<InventoryTransaction, crate::error::Error>;

    /// Gets the current stock level for a product.
    async fn get_stock_level(&self, tenant_id: Uuid, product_id: Uuid) -> Result<Decimal, crate::error::Error>;
}
