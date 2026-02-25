use axum::extract::State;
use axum::http::HeaderMap;
use axum::Json;
use smart_erp_core::models::reports::*;
use crate::error::AppError;
use crate::state::AppState;
use infrastructure::db::reports::PostgresReportsRepository;
use uuid::Uuid;

pub async fn profit_and_loss(State(state): State<AppState>, headers: HeaderMap) -> Result<Json<ProfitAndLoss>, AppError> {
    let tid = get_tenant_id(&headers)?;
    let repo = PostgresReportsRepository::new(state.pool);
    Ok(Json(repo.profit_and_loss(tid).await?))
}

pub async fn balance_sheet(State(state): State<AppState>, headers: HeaderMap) -> Result<Json<BalanceSheet>, AppError> {
    let tid = get_tenant_id(&headers)?;
    let repo = PostgresReportsRepository::new(state.pool);
    Ok(Json(repo.balance_sheet(tid).await?))
}

pub async fn trial_balance(State(state): State<AppState>, headers: HeaderMap) -> Result<Json<TrialBalance>, AppError> {
    let tid = get_tenant_id(&headers)?;
    let repo = PostgresReportsRepository::new(state.pool);
    Ok(Json(repo.trial_balance(tid).await?))
}

pub async fn ar_aging(State(state): State<AppState>, headers: HeaderMap) -> Result<Json<AgingReport>, AppError> {
    let tid = get_tenant_id(&headers)?;
    let repo = PostgresReportsRepository::new(state.pool);
    Ok(Json(repo.ar_aging(tid).await?))
}

pub async fn ap_aging(State(state): State<AppState>, headers: HeaderMap) -> Result<Json<AgingReport>, AppError> {
    let tid = get_tenant_id(&headers)?;
    let repo = PostgresReportsRepository::new(state.pool);
    Ok(Json(repo.ap_aging(tid).await?))
}

pub async fn sales_summary(State(state): State<AppState>, headers: HeaderMap) -> Result<Json<SalesSummary>, AppError> {
    let tid = get_tenant_id(&headers)?;
    let repo = PostgresReportsRepository::new(state.pool);
    Ok(Json(repo.sales_summary(tid).await?))
}

pub async fn general_ledger(State(state): State<AppState>, headers: HeaderMap) -> Result<Json<GeneralLedger>, AppError> {
    let tid = get_tenant_id(&headers)?;
    let repo = PostgresReportsRepository::new(state.pool);
    Ok(Json(repo.general_ledger(tid).await?))
}

fn get_tenant_id(headers: &HeaderMap) -> Result<Uuid, AppError> {
    headers.get("x-tenant-id")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| Uuid::parse_str(v).ok())
        .ok_or(AppError(smart_erp_core::error::Error::BusinessRule("Missing or invalid x-tenant-id header".to_string())))
}
