use serde::{Deserialize, Serialize};
use sqlx::types::Uuid;
use rust_decimal::Decimal;
use chrono::{DateTime, NaiveDate, Utc};
use strum::{Display, EnumString};
use async_trait::async_trait;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Recipe {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub name: String,
    pub output_product_id: Uuid,
    pub output_quantity: Decimal,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct RecipeIngredient {
    pub id: Uuid,
    pub recipe_id: Uuid,
    pub input_product_id: Uuid,
    pub quantity: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, EnumString, Display, sqlx::Type)]
#[sqlx(type_name = "work_order_status", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum WorkOrderStatus {
    #[strum(serialize = "PLANNED")]
    Planned,
    #[strum(serialize = "IN_PROGRESS")]
    InProgress,
    #[strum(serialize = "COMPLETED")]
    Completed,
    #[strum(serialize = "CANCELLED")]
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct WorkOrder {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub recipe_id: Uuid,
    pub quantity: Decimal,
    pub status: WorkOrderStatus,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateRecipeIngredient {
    pub input_product_id: Uuid,
    pub quantity: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateRecipe {
    pub name: String,
    pub output_product_id: Uuid,
    pub output_quantity: Decimal,
    pub description: Option<String>,
    pub ingredients: Vec<CreateRecipeIngredient>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateWorkOrder {
    pub recipe_id: Uuid,
    pub quantity: Decimal,
    pub start_date: Option<NaiveDate>,
}

#[async_trait]
pub trait ManufacturingService: Send + Sync {
    async fn create_recipe(
        &self,
        tenant_id: Uuid,
        recipe: CreateRecipe,
    ) -> Result<Recipe, crate::error::Error>;

    async fn create_work_order(
        &self,
        tenant_id: Uuid,
        work_order: CreateWorkOrder,
    ) -> Result<WorkOrder, crate::error::Error>;

    /// Completes a Work Order.
    /// This must:
    /// 1. Validate status is IN_PROGRESS (or PLANNED).
    /// 2. Update status to COMPLETED.
    /// 3. Fetch Recipe Ingredients.
    /// 4. Create Inventory Transactions (PRODUCTION_OUT) for all ingredients * quantity.
    /// 5. Create Inventory Transaction (PRODUCTION_IN) for output product * quantity.
    /// 6. Update Product Stocks.
    async fn complete_work_order(&self, tenant_id: Uuid, work_order_id: Uuid) -> Result<WorkOrder, crate::error::Error>;
}
