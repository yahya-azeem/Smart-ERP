use axum::extract::State;
use axum::http::HeaderMap;
use axum::Json;
use smart_erp_core::models::employee::{Employee, CreateEmployee};
use crate::error::AppError;
use crate::state::AppState;
use infrastructure::db::employee::PostgresEmployeeRepository;
use uuid::Uuid;

pub async fn list_employees(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<Employee>>, AppError> {
    let tenant_id = get_tenant_id(&headers)?;
    let repo = PostgresEmployeeRepository::new(state.pool);
    let employees = repo.list_employees(tenant_id).await?;
    Ok(Json(employees))
}

pub async fn create_employee(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateEmployee>,
) -> Result<Json<Employee>, AppError> {
    let tenant_id = get_tenant_id(&headers)?;
    let repo = PostgresEmployeeRepository::new(state.pool);
    let employee = repo.create_employee(tenant_id, payload).await?;
    Ok(Json(employee))
}

pub async fn delete_employee(
    State(state): State<AppState>,
    headers: HeaderMap,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let tenant_id = get_tenant_id(&headers)?;
    let repo = PostgresEmployeeRepository::new(state.pool);
    repo.delete_employee(tenant_id, id).await?;
    Ok(Json(serde_json::json!({"success": true})))
}

fn get_tenant_id(headers: &HeaderMap) -> Result<Uuid, AppError> {
    headers
        .get("x-tenant-id")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| Uuid::parse_str(v).ok())
        .ok_or(AppError(smart_erp_core::error::Error::BusinessRule("Missing or invalid x-tenant-id header".to_string())))
}
