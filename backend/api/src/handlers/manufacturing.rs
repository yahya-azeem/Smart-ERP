use axum::{
    extract::{Path, State},
    http::HeaderMap,
    Json,
};
use smart_erp_core::models::manufacturing::{
    CreateRecipe, CreateWorkOrder, ManufacturingService, Recipe, WorkOrder,
};
use infrastructure::db::manufacturing::PostgresManufacturingRepository;
use uuid::Uuid;
use crate::state::AppState;
use crate::error::AppError;

pub async fn create_recipe(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateRecipe>,
) -> Result<Json<Recipe>, AppError> {
    let tenant_id = get_tenant_id(&headers)?;
    let repo = PostgresManufacturingRepository::new(state.pool);
    let recipe = repo.create_recipe(tenant_id, payload).await?;
    Ok(Json(recipe))
}

pub async fn create_work_order(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateWorkOrder>,
) -> Result<Json<WorkOrder>, AppError> {
    let tenant_id = get_tenant_id(&headers)?;
    let repo = PostgresManufacturingRepository::new(state.pool);
    let order = repo.create_work_order(tenant_id, payload).await?;
    Ok(Json(order))
}

pub async fn complete_work_order(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(order_id): Path<Uuid>,
) -> Result<Json<WorkOrder>, AppError> {
    let tenant_id = get_tenant_id(&headers)?;
    let repo = PostgresManufacturingRepository::new(state.pool);
    let order = repo.complete_work_order(tenant_id, order_id).await?;
    Ok(Json(order))
}

fn get_tenant_id(headers: &HeaderMap) -> Result<Uuid, AppError> {
    headers
        .get("x-tenant-id")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| Uuid::parse_str(v).ok())
        .ok_or(AppError(smart_erp_core::error::Error::BusinessRule("Missing or invalid x-tenant-id header".to_string())))
}
