use axum::extract::State;
use axum::http::HeaderMap;
use axum::Json;
use smart_erp_core::models::transactions::*;
use crate::error::AppError;
use crate::state::AppState;
use infrastructure::db::transactions::PostgresTransactionsRepository;
use uuid::Uuid;

// --- Estimates ---
pub async fn list_estimates(State(state): State<AppState>, headers: HeaderMap) -> Result<Json<Vec<Estimate>>, AppError> {
    let tid = get_tenant_id(&headers)?;
    let repo = PostgresTransactionsRepository::new(state.pool);
    Ok(Json(repo.list_estimates(tid).await?))
}

pub async fn create_estimate(State(state): State<AppState>, headers: HeaderMap, Json(p): Json<CreateEstimate>) -> Result<Json<Estimate>, AppError> {
    let tid = get_tenant_id(&headers)?;
    let repo = PostgresTransactionsRepository::new(state.pool);
    Ok(Json(repo.create_estimate(tid, p).await?))
}

// --- Bills ---
pub async fn list_bills(State(state): State<AppState>, headers: HeaderMap) -> Result<Json<Vec<Bill>>, AppError> {
    let tid = get_tenant_id(&headers)?;
    let repo = PostgresTransactionsRepository::new(state.pool);
    Ok(Json(repo.list_bills(tid).await?))
}

pub async fn create_bill(State(state): State<AppState>, headers: HeaderMap, Json(p): Json<CreateBill>) -> Result<Json<Bill>, AppError> {
    let tid = get_tenant_id(&headers)?;
    let repo = PostgresTransactionsRepository::new(state.pool);
    Ok(Json(repo.create_bill(tid, p).await?))
}

// --- Sales Receipts ---
pub async fn list_sales_receipts(State(state): State<AppState>, headers: HeaderMap) -> Result<Json<Vec<SalesReceipt>>, AppError> {
    let tid = get_tenant_id(&headers)?;
    let repo = PostgresTransactionsRepository::new(state.pool);
    Ok(Json(repo.list_sales_receipts(tid).await?))
}

pub async fn create_sales_receipt(State(state): State<AppState>, headers: HeaderMap, Json(p): Json<CreateSalesReceipt>) -> Result<Json<SalesReceipt>, AppError> {
    let tid = get_tenant_id(&headers)?;
    let repo = PostgresTransactionsRepository::new(state.pool);
    Ok(Json(repo.create_sales_receipt(tid, p).await?))
}

// --- Credit Memos ---
pub async fn list_credit_memos(State(state): State<AppState>, headers: HeaderMap) -> Result<Json<Vec<CreditMemo>>, AppError> {
    let tid = get_tenant_id(&headers)?;
    let repo = PostgresTransactionsRepository::new(state.pool);
    Ok(Json(repo.list_credit_memos(tid).await?))
}

pub async fn create_credit_memo(State(state): State<AppState>, headers: HeaderMap, Json(p): Json<CreateCreditMemo>) -> Result<Json<CreditMemo>, AppError> {
    let tid = get_tenant_id(&headers)?;
    let repo = PostgresTransactionsRepository::new(state.pool);
    Ok(Json(repo.create_credit_memo(tid, p).await?))
}

// --- Journal Entries ---
pub async fn list_journal_entries(State(state): State<AppState>, headers: HeaderMap) -> Result<Json<Vec<JournalEntry>>, AppError> {
    let tid = get_tenant_id(&headers)?;
    let repo = PostgresTransactionsRepository::new(state.pool);
    Ok(Json(repo.list_journal_entries(tid).await?))
}

pub async fn create_journal_entry(State(state): State<AppState>, headers: HeaderMap, Json(p): Json<CreateJournalEntry>) -> Result<Json<JournalEntry>, AppError> {
    let tid = get_tenant_id(&headers)?;
    let repo = PostgresTransactionsRepository::new(state.pool);
    Ok(Json(repo.create_journal_entry(tid, p).await?))
}

// --- Checks ---
pub async fn list_checks(State(state): State<AppState>, headers: HeaderMap) -> Result<Json<Vec<Check>>, AppError> {
    let tid = get_tenant_id(&headers)?;
    let repo = PostgresTransactionsRepository::new(state.pool);
    Ok(Json(repo.list_checks(tid).await?))
}

pub async fn create_check(State(state): State<AppState>, headers: HeaderMap, Json(p): Json<CreateCheck>) -> Result<Json<Check>, AppError> {
    let tid = get_tenant_id(&headers)?;
    let repo = PostgresTransactionsRepository::new(state.pool);
    Ok(Json(repo.create_check(tid, p).await?))
}

fn get_tenant_id(headers: &HeaderMap) -> Result<Uuid, AppError> {
    headers.get("x-tenant-id")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| Uuid::parse_str(v).ok())
        .ok_or(AppError(smart_erp_core::error::Error::BusinessRule("Missing or invalid x-tenant-id header".to_string())))
}
