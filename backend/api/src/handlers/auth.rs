use axum::{
    extract::State,
    http::HeaderMap,
    Json,
};
use smart_erp_core::models::auth::{
    AuthResponse, AuthService, LoginRequest, RegisterRequest, User,
};
use infrastructure::db::auth::PostgresAuthRepository;
use uuid::Uuid;
use crate::state::AppState;
use crate::error::AppError;

pub async fn login(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    let tenant_id = get_tenant_id(&headers)?;
    let repo = PostgresAuthRepository::new(state.pool, state.jwt_secret);
    let response = repo.login(tenant_id, payload).await?;
    Ok(Json(response))
}

pub async fn register(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<RegisterRequest>,
) -> Result<Json<User>, AppError> {
    let tenant_id = get_tenant_id(&headers)?;
    let repo = PostgresAuthRepository::new(state.pool, state.jwt_secret);
    let user = repo.register(tenant_id, payload).await?;
    Ok(Json(user))
}

fn get_tenant_id(headers: &HeaderMap) -> Result<Uuid, AppError> {
    headers
        .get("x-tenant-id")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| Uuid::parse_str(v).ok())
        .ok_or(AppError(smart_erp_core::error::Error::BusinessRule("Missing or invalid x-tenant-id header".to_string())))
}
