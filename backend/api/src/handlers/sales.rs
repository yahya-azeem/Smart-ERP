use axum::{
    extract::{Path, State},
    http::HeaderMap,
    Json,
};
use smart_erp_core::models::sales::{
    CreateCustomer, CreateSalesOrder, Customer, SalesOrder, SalesService,
};
use smart_erp_core::models::analytics::SalesTrend;
use infrastructure::db::sales::PostgresSalesRepository;
use uuid::Uuid;
use crate::state::AppState;
use crate::error::AppError;

pub async fn create_customer(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateCustomer>,
) -> Result<Json<Customer>, AppError> {
    let tenant_id = get_tenant_id(&headers)?;
    let repo = PostgresSalesRepository::new(state.pool);
    let customer = repo.create_customer(tenant_id, payload).await?;
    Ok(Json(customer))
}

pub async fn create_sales_order(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateSalesOrder>,
) -> Result<Json<SalesOrder>, AppError> {
    let tenant_id = get_tenant_id(&headers)?;
    let repo = PostgresSalesRepository::new(state.pool);
    let order = repo.create_order(tenant_id, payload).await?;
    Ok(Json(order))
}

pub async fn ship_sales_order(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(order_id): Path<Uuid>,
) -> Result<Json<SalesOrder>, AppError> {
    let tenant_id = get_tenant_id(&headers)?;
    let repo = PostgresSalesRepository::new(state.pool);
    let order = repo.ship_order(tenant_id, order_id).await?;
    Ok(Json(order))
}

pub async fn get_sales_trend(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<SalesTrend>>, AppError> {
    let tenant_id = get_tenant_id(&headers)?;
    let repo = PostgresSalesRepository::new(state.pool);
    let trend = repo.get_sales_trend(tenant_id).await?;
    Ok(Json(trend))
}

fn get_tenant_id(headers: &HeaderMap) -> Result<Uuid, AppError> {
    headers
        .get("x-tenant-id")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| Uuid::parse_str(v).ok())
        .ok_or(AppError(smart_erp_core::error::Error::BusinessRule("Missing or invalid x-tenant-id header".to_string())))
}
