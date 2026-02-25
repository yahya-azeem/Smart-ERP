use async_trait::async_trait;
use smart_erp_core::models::accounting::{
    AccountingService, CreateInvoice, CreatePayment, Invoice, InvoiceStatus, Payment,
};
use smart_erp_core::error::Error;
use sqlx::{PgPool, Postgres, Row, Transaction};
use uuid::Uuid;

pub struct PostgresAccountingRepository {
    pool: PgPool,
}

impl PostgresAccountingRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn list_invoices(&self, tenant_id: Uuid) -> Result<Vec<Invoice>, Error> {
        let rows = sqlx::query_as::<_, Invoice>(
            "SELECT id, tenant_id, customer_id, sales_order_id, invoice_number, date, due_date, status, total_amount, amount_paid, created_at, updated_at FROM invoices WHERE tenant_id = $1 ORDER BY created_at DESC"
        )
        .bind(tenant_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Error::Database(e.to_string()))?;
        Ok(rows)
    }

    pub async fn list_payments(&self, tenant_id: Uuid) -> Result<Vec<Payment>, Error> {
        let rows = sqlx::query_as::<_, Payment>(
            "SELECT id, tenant_id, invoice_id, amount, date, method, reference, created_at, updated_at FROM payments WHERE tenant_id = $1 ORDER BY created_at DESC"
        )
        .bind(tenant_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Error::Database(e.to_string()))?;
        Ok(rows)
    }
}

#[async_trait]
impl AccountingService for PostgresAccountingRepository {
    async fn create_invoice(
        &self,
        tenant_id: Uuid,
        invoice: CreateInvoice,
    ) -> Result<Invoice, Error> {
        let record = sqlx::query_as::<_, Invoice>(
            r#"
            INSERT INTO invoices (tenant_id, customer_id, sales_order_id, invoice_number, date, due_date, total_amount, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'DRAFT')
            RETURNING id, tenant_id, customer_id, sales_order_id, invoice_number, date, due_date, status, total_amount, amount_paid, created_at, updated_at
            "#
        )
        .bind(tenant_id)
        .bind(invoice.customer_id)
        .bind(invoice.sales_order_id)
        .bind(invoice.invoice_number)
        .bind(invoice.date)
        .bind(invoice.due_date)
        .bind(invoice.total_amount)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Error::Database(e.to_string()))?;

        Ok(record)
    }

    async fn record_payment(
        &self,
        tenant_id: Uuid,
        payment: CreatePayment,
    ) -> Result<Payment, Error> {
        let mut tx: Transaction<'_, Postgres> = self.pool.begin().await.map_err(|e| Error::Database(e.to_string()))?;

        let created_payment = sqlx::query_as::<_, Payment>(
            r#"
            INSERT INTO payments (tenant_id, invoice_id, amount, date, method, reference)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, tenant_id, invoice_id, amount, date, method, reference, created_at, updated_at
            "#
        )
        .bind(tenant_id)
        .bind(payment.invoice_id)
        .bind(payment.amount)
        .bind(payment.date)
        .bind(payment.method)
        .bind(payment.reference)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| Error::Database(e.to_string()))?;

        let invoice_row = sqlx::query(
            r#"
            SELECT total_amount, amount_paid FROM invoices WHERE id = $1 FOR UPDATE
            "#
        )
        .bind(payment.invoice_id)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| Error::Database(e.to_string()))?;

        let total_amount: rust_decimal::Decimal = invoice_row.try_get("total_amount").unwrap_or_default();
        let amount_paid: rust_decimal::Decimal = invoice_row.try_get("amount_paid").unwrap_or_default();

        let new_amount_paid = amount_paid + payment.amount;
        let new_status = if new_amount_paid >= total_amount {
            InvoiceStatus::Paid
        } else {
            InvoiceStatus::PartiallyPaid
        };

        sqlx::query(
            r#"
            UPDATE invoices
            SET amount_paid = $1, status = $2, updated_at = NOW()
            WHERE id = $3
            "#
        )
        .bind(new_amount_paid)
        .bind(new_status)
        .bind(payment.invoice_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| Error::Database(e.to_string()))?;

        tx.commit().await.map_err(|e| Error::Database(e.to_string()))?;

        Ok(created_payment)
    }
}
