use axum::{
    extract::{Path, State},
    http::HeaderMap,
    Json,
};
use smart_erp_core::models::purchasing::{
    CreatePurchaseOrder, CreateSupplier, PurchaseOrder, PurchasingService, Supplier,
};
use infrastructure::db::purchasing::PostgresPurchasingRepository;
use uuid::Uuid;
use crate::state::AppState;
use crate::error::AppError;

pub async fn create_supplier(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateSupplier>,
) -> Result<Json<Supplier>, AppError> {
    let tenant_id = get_tenant_id(&headers)?;
    let repo = PostgresPurchasingRepository::new(state.pool);
    let supplier = repo.create_supplier(tenant_id, payload).await?;
    Ok(Json(supplier))
}

pub async fn create_purchase_order(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreatePurchaseOrder>,
) -> Result<Json<PurchaseOrder>, AppError> {
    let tenant_id = get_tenant_id(&headers)?;
    let repo = PostgresPurchasingRepository::new(state.pool);
    let order = repo.create_order(tenant_id, payload).await?;
    Ok(Json(order))
}

pub async fn receive_purchase_order(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(order_id): Path<Uuid>,
) -> Result<Json<PurchaseOrder>, AppError> {
    let tenant_id = get_tenant_id(&headers)?;
    let repo = PostgresPurchasingRepository::new(state.pool);
    let order = repo.receive_order(tenant_id, order_id).await?;
    Ok(Json(order))
}

fn get_tenant_id(headers: &HeaderMap) -> Result<Uuid, AppError> {
    headers
        .get("x-tenant-id")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| Uuid::parse_str(v).ok())
        .ok_or(AppError(smart_erp_core::error::Error::BusinessRule("Missing or invalid x-tenant-id header".to_string())))
}
