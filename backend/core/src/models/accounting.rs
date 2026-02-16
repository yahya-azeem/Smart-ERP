use serde::{Deserialize, Serialize};
use sqlx::types::Uuid;
use rust_decimal::Decimal;
use chrono::{DateTime, NaiveDate, Utc};
use strum::{Display, EnumString};
use async_trait::async_trait;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, EnumString, Display, sqlx::Type)]
#[sqlx(type_name = "invoice_status", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum InvoiceStatus {
    #[strum(serialize = "DRAFT")]
    Draft,
    #[strum(serialize = "SENT")]
    Sent,
    #[strum(serialize = "PAID")]
    Paid,
    #[strum(serialize = "PARTIALLY_PAID")]
    PartiallyPaid,
    #[strum(serialize = "OVERDUE")]
    Overdue,
    #[strum(serialize = "CANCELLED")]
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Invoice {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub customer_id: Uuid,
    pub sales_order_id: Option<Uuid>,
    pub invoice_number: String,
    pub date: NaiveDate,
    pub due_date: NaiveDate,
    pub status: InvoiceStatus,
    pub total_amount: Decimal,
    pub amount_paid: Decimal,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, EnumString, Display, sqlx::Type)]
#[sqlx(type_name = "payment_method", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum PaymentMethod {
    #[strum(serialize = "CASH")]
    Cash,
    #[strum(serialize = "BANK_TRANSFER")]
    BankTransfer,
    #[strum(serialize = "CREDIT_CARD")]
    CreditCard,
    #[strum(serialize = "OTHER")]
    Other,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Payment {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub invoice_id: Uuid,
    pub amount: Decimal,
    pub date: NaiveDate,
    pub method: PaymentMethod,
    pub reference: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateInvoice {
    pub customer_id: Uuid,
    pub sales_order_id: Option<Uuid>,
    pub invoice_number: String,
    pub date: NaiveDate,
    pub due_date: NaiveDate,
    pub total_amount: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePayment {
    pub invoice_id: Uuid,
    pub amount: Decimal,
    pub date: NaiveDate,
    pub method: PaymentMethod,
    pub reference: Option<String>,
}

#[async_trait]
pub trait AccountingService: Send + Sync {
    async fn create_invoice(
        &self,
        tenant_id: Uuid,
        invoice: CreateInvoice,
    ) -> Result<Invoice, crate::error::Error>;

    /// Records a payment and updates the invoice status.
    /// Logic:
    /// 1. Insert Payment.
    /// 2. Update Invoice amount_paid.
    /// 3. Update Invoice status (PAID if amount_paid >= total_amount, else PARTIALLY_PAID).
    async fn record_payment(
        &self,
        tenant_id: Uuid,
        payment: CreatePayment,
    ) -> Result<Payment, crate::error::Error>;
}
