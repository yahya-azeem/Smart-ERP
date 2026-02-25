use axum::{
    extract::State,
    http::HeaderMap,
    Json,
};
use smart_erp_core::models::accounting::{
    AccountingService, CreateInvoice, CreatePayment, Invoice, Payment,
};
use infrastructure::db::accounting::PostgresAccountingRepository;
use uuid::Uuid;
use crate::state::AppState;
use crate::error::AppError;

pub async fn list_invoices(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<Invoice>>, AppError> {
    let tenant_id = get_tenant_id(&headers)?;
    let repo = PostgresAccountingRepository::new(state.pool);
    let invoices = repo.list_invoices(tenant_id).await?;
    Ok(Json(invoices))
}

pub async fn list_payments(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<Payment>>, AppError> {
    let tenant_id = get_tenant_id(&headers)?;
    let repo = PostgresAccountingRepository::new(state.pool);
    let payments = repo.list_payments(tenant_id).await?;
    Ok(Json(payments))
}

pub async fn create_invoice(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateInvoice>,
) -> Result<Json<Invoice>, AppError> {
    let tenant_id = get_tenant_id(&headers)?;
    let repo = PostgresAccountingRepository::new(state.pool);
    let invoice = repo.create_invoice(tenant_id, payload).await?;
    Ok(Json(invoice))
}

pub async fn record_payment(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreatePayment>,
) -> Result<Json<Payment>, AppError> {
    let tenant_id = get_tenant_id(&headers)?;
    let repo = PostgresAccountingRepository::new(state.pool);
    let payment = repo.record_payment(tenant_id, payload).await?;
    Ok(Json(payment))
}

fn get_tenant_id(headers: &HeaderMap) -> Result<Uuid, AppError> {
    headers
        .get("x-tenant-id")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| Uuid::parse_str(v).ok())
        .ok_or(AppError(smart_erp_core::error::Error::BusinessRule("Missing or invalid x-tenant-id header".to_string())))
}
