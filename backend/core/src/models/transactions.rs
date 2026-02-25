use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc, NaiveDate};

// --- Invoice Lines ---
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct InvoiceLine {
    pub id: Uuid,
    pub invoice_id: Uuid,
    pub product_id: Option<Uuid>,
    pub description: String,
    pub quantity: rust_decimal::Decimal,
    pub unit_price: rust_decimal::Decimal,
    pub amount: rust_decimal::Decimal,
    pub account_id: Option<Uuid>,
    pub sort_order: i32,
}

// --- Estimates ---
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Estimate {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub customer_id: Uuid,
    pub estimate_number: String,
    pub date: NaiveDate,
    pub expiration_date: Option<NaiveDate>,
    pub status: String,
    pub total_amount: rust_decimal::Decimal,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateEstimate {
    pub customer_id: Uuid,
    pub estimate_number: String,
    pub date: Option<NaiveDate>,
    pub expiration_date: Option<NaiveDate>,
    pub total_amount: f64,
    pub notes: Option<String>,
}

// --- Bills ---
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Bill {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub supplier_id: Uuid,
    pub bill_number: String,
    pub date: NaiveDate,
    pub due_date: NaiveDate,
    pub status: String,
    pub total_amount: rust_decimal::Decimal,
    pub amount_paid: rust_decimal::Decimal,
    pub terms: Option<String>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateBill {
    pub supplier_id: Uuid,
    pub bill_number: String,
    pub date: Option<NaiveDate>,
    pub due_date: NaiveDate,
    pub total_amount: f64,
    pub terms: Option<String>,
    pub notes: Option<String>,
}

// --- Sales Receipts ---
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct SalesReceipt {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub customer_id: Option<Uuid>,
    pub receipt_number: String,
    pub date: NaiveDate,
    pub total_amount: rust_decimal::Decimal,
    pub payment_method: String,
    pub deposit_to_account: Option<Uuid>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateSalesReceipt {
    pub customer_id: Option<Uuid>,
    pub receipt_number: String,
    pub total_amount: f64,
    pub payment_method: String,
    pub notes: Option<String>,
}

// --- Credit Memos ---
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct CreditMemo {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub customer_id: Uuid,
    pub memo_number: String,
    pub date: NaiveDate,
    pub total_amount: rust_decimal::Decimal,
    pub status: String,
    pub applied_to_invoice: Option<Uuid>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateCreditMemo {
    pub customer_id: Uuid,
    pub memo_number: String,
    pub total_amount: f64,
    pub notes: Option<String>,
}

// --- Journal Entries ---
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct JournalEntry {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub entry_number: String,
    pub date: NaiveDate,
    pub memo: Option<String>,
    pub is_adjusting: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct JournalEntryLine {
    pub id: Uuid,
    pub entry_id: Uuid,
    pub account_id: Uuid,
    pub debit: rust_decimal::Decimal,
    pub credit: rust_decimal::Decimal,
    pub memo: Option<String>,
    pub sort_order: i32,
}

#[derive(Debug, Deserialize)]
pub struct CreateJournalEntry {
    pub entry_number: String,
    pub date: Option<NaiveDate>,
    pub memo: Option<String>,
    pub is_adjusting: bool,
    pub lines: Vec<CreateJournalEntryLine>,
}

#[derive(Debug, Deserialize)]
pub struct CreateJournalEntryLine {
    pub account_id: Uuid,
    pub debit: f64,
    pub credit: f64,
    pub memo: Option<String>,
}

// --- Checks ---
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Check {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub bank_account_id: Uuid,
    pub payee_type: String,
    pub payee_id: Option<Uuid>,
    pub payee_name: String,
    pub check_number: Option<String>,
    pub date: NaiveDate,
    pub total_amount: rust_decimal::Decimal,
    pub memo: Option<String>,
    pub is_printed: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateCheck {
    pub bank_account_id: Uuid,
    pub payee_name: String,
    pub check_number: Option<String>,
    pub total_amount: f64,
    pub memo: Option<String>,
}
