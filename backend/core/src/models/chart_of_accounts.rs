use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Account {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub parent_id: Option<Uuid>,
    pub account_number: Option<String>,
    pub name: String,
    pub account_type: String,
    pub detail_type: Option<String>,
    pub description: Option<String>,
    pub balance: rust_decimal::Decimal,
    pub is_active: bool,
    pub is_system: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateAccount {
    pub parent_id: Option<Uuid>,
    pub account_number: Option<String>,
    pub name: String,
    pub account_type: String,
    pub detail_type: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateAccount {
    pub name: Option<String>,
    pub account_number: Option<String>,
    pub description: Option<String>,
    pub is_active: Option<bool>,
    pub parent_id: Option<Uuid>,
}
