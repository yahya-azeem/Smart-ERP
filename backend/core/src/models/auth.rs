use serde::{Deserialize, Serialize};
use sqlx::types::Uuid;
use chrono::{DateTime, Utc};
use strum::{Display, EnumString};
use async_trait::async_trait;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, EnumString, Display, sqlx::Type)]
#[sqlx(type_name = "varchar", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Role {
    #[strum(serialize = "ADMIN")]
    Admin,
    #[strum(serialize = "USER")]
    User,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct User {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub username: String,
    #[serde(skip)]
    pub password_hash: String,
    pub role: String, // Simplified mapping for now, or use Role enum if DB type matches
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub password: String,
    pub role: Role,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: User,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: Uuid, // User ID
    pub tenant_id: Uuid,
    pub role: String,
    pub exp: usize,
}

#[async_trait]
pub trait AuthService: Send + Sync {
    async fn login(&self, tenant_id: Uuid, req: LoginRequest) -> Result<AuthResponse, crate::error::Error>;
    async fn register(&self, tenant_id: Uuid, req: RegisterRequest) -> Result<User, crate::error::Error>;
}
