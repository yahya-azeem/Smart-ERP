use axum::{
    extract::State,
    http::HeaderMap,
    Json,
};
use smart_erp_core::models::product::{CreateProduct, Product, ProductService};
use infrastructure::db::product::PostgresProductRepository;
use uuid::Uuid;
use crate::state::AppState;
use crate::error::AppError;

pub async fn list_products(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<Product>>, AppError> {
    let tenant_id = get_tenant_id(&headers)?;
    let repo = PostgresProductRepository::new(state.pool);
    let products = repo.list_products(tenant_id).await?;
    Ok(Json(products))
}

pub async fn create_product(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateProduct>,
) -> Result<Json<Product>, AppError> {
    let tenant_id = get_tenant_id(&headers)?;
    let repo = PostgresProductRepository::new(state.pool);
    let product = repo.create_product(tenant_id, payload).await?;
    Ok(Json(product))
}

fn get_tenant_id(headers: &HeaderMap) -> Result<Uuid, AppError> {
    headers
        .get("x-tenant-id")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| Uuid::parse_str(v).ok())
        .ok_or(AppError(smart_erp_core::error::Error::BusinessRule("Missing or invalid x-tenant-id header".to_string())))
}
