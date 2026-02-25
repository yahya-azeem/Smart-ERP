use serde::{Deserialize, Serialize};
use rust_decimal::Decimal;
use chrono::NaiveDate;

// --- Profit & Loss ---
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfitAndLoss {
    pub income: Vec<ReportLine>,
    pub cogs: Vec<ReportLine>,
    pub expenses: Vec<ReportLine>,
    pub total_income: Decimal,
    pub total_cogs: Decimal,
    pub gross_profit: Decimal,
    pub total_expenses: Decimal,
    pub net_income: Decimal,
}

// --- Balance Sheet ---
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BalanceSheet {
    pub assets: Vec<ReportLine>,
    pub liabilities: Vec<ReportLine>,
    pub equity: Vec<ReportLine>,
    pub total_assets: Decimal,
    pub total_liabilities: Decimal,
    pub total_equity: Decimal,
}

// --- Trial Balance ---
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrialBalance {
    pub lines: Vec<TrialBalanceLine>,
    pub total_debits: Decimal,
    pub total_credits: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrialBalanceLine {
    pub account_number: String,
    pub account_name: String,
    pub account_type: String,
    pub debit: Decimal,
    pub credit: Decimal,
}

// --- A/R Aging ---
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgingReport {
    pub lines: Vec<AgingLine>,
    pub total_current: Decimal,
    pub total_1_30: Decimal,
    pub total_31_60: Decimal,
    pub total_61_90: Decimal,
    pub total_over_90: Decimal,
    pub grand_total: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgingLine {
    pub name: String,
    pub current: Decimal,
    pub days_1_30: Decimal,
    pub days_31_60: Decimal,
    pub days_61_90: Decimal,
    pub over_90: Decimal,
    pub total: Decimal,
}

// --- Shared ---
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReportLine {
    pub account_number: String,
    pub name: String,
    pub amount: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SalesSummary {
    pub total_invoiced: Decimal,
    pub total_collected: Decimal,
    pub outstanding: Decimal,
    pub invoice_count: i64,
    pub avg_invoice: Decimal,
    pub monthly: Vec<MonthlySales>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonthlySales {
    pub month: String,
    pub revenue: Decimal,
    pub count: i64,
}

#[derive(Debug, Deserialize)]
pub struct ReportDateRange {
    pub from: Option<NaiveDate>,
    pub to: Option<NaiveDate>,
}

// --- General Ledger ---
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneralLedger {
    pub entries: Vec<GeneralLedgerEntry>,
    pub total_debits: Decimal,
    pub total_credits: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneralLedgerEntry {
    pub date: NaiveDate,
    pub account_number: String,
    pub account_name: String,
    pub description: String,
    pub debit: Decimal,
    pub credit: Decimal,
    pub balance: Decimal,
    pub source: String,
}
