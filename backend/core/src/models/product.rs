use serde::{Deserialize, Serialize};
use sqlx::types::Uuid;
use rust_decimal::Decimal;
use chrono::{DateTime, Utc};
use strum::{Display, EnumString};
use async_trait::async_trait;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, EnumString, Display, sqlx::Type)]
#[sqlx(type_name = "varchar", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum UnitOfMeasure {
    #[strum(serialize = "UNIT")]
    Unit,
    #[strum(serialize = "SQ_FT")]
    SquareFeet,
    #[strum(serialize = "KG")]
    Kilogram,
    #[strum(serialize = "PIECE")]
    Piece,
    #[strum(serialize = "METER")]
    Meter,
    #[strum(serialize = "LITER")]
    Liter,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Product {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub name: String,
    pub sku: String,
    pub description: Option<String>,
    pub unit_of_measure: UnitOfMeasure,
    pub price: Decimal,
    pub cost_price: Decimal,
    pub stock_quantity: Decimal,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateProduct {
    pub name: String,
    pub sku: String,
    pub description: Option<String>,
    pub unit_of_measure: UnitOfMeasure,
    pub price: Decimal,
    pub cost_price: Decimal,
}

#[async_trait]
pub trait ProductService: Send + Sync {
    async fn create_product(&self, tenant_id: Uuid, product: CreateProduct) -> Result<Product, crate::error::Error>;
    async fn list_products(&self, tenant_id: Uuid) -> Result<Vec<Product>, crate::error::Error>;
    async fn get_product(&self, tenant_id: Uuid, product_id: Uuid) -> Result<Product, crate::error::Error>;
}
