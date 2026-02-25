use axum::extract::State;
use axum::http::HeaderMap;
use axum::Json;
use smart_erp_core::models::chart_of_accounts::{Account, CreateAccount};
use crate::error::AppError;
use crate::state::AppState;
use infrastructure::db::chart_of_accounts::PostgresAccountsRepository;
use uuid::Uuid;

pub async fn list_accounts(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<Account>>, AppError> {
    let tenant_id = get_tenant_id(&headers)?;
    let repo = PostgresAccountsRepository::new(state.pool);
    let accounts = repo.list_accounts(tenant_id).await?;
    Ok(Json(accounts))
}

pub async fn create_account(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateAccount>,
) -> Result<Json<Account>, AppError> {
    let tenant_id = get_tenant_id(&headers)?;
    let repo = PostgresAccountsRepository::new(state.pool);
    let account = repo.create_account(tenant_id, payload).await?;
    Ok(Json(account))
}

pub async fn delete_account(
    State(state): State<AppState>,
    headers: HeaderMap,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let tenant_id = get_tenant_id(&headers)?;
    let repo = PostgresAccountsRepository::new(state.pool);
    repo.delete_account(tenant_id, id).await?;
    Ok(Json(serde_json::json!({"success": true})))
}

fn get_tenant_id(headers: &HeaderMap) -> Result<Uuid, AppError> {
    headers
        .get("x-tenant-id")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| Uuid::parse_str(v).ok())
        .ok_or(AppError(smart_erp_core::error::Error::BusinessRule("Missing or invalid x-tenant-id header".to_string())))
}
