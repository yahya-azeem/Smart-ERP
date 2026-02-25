use smart_erp_core::models::transactions::*;
use smart_erp_core::error::Error;
use sqlx::PgPool;
use uuid::Uuid;

pub struct PostgresTransactionsRepository {
    pool: PgPool,
}

impl PostgresTransactionsRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    // --- Invoice Lines ---
    pub async fn list_invoice_lines(&self, invoice_id: Uuid) -> Result<Vec<InvoiceLine>, Error> {
        sqlx::query_as::<_, InvoiceLine>("SELECT * FROM invoice_lines WHERE invoice_id = $1 ORDER BY sort_order")
            .bind(invoice_id).fetch_all(&self.pool).await.map_err(|e| Error::Database(e.to_string()))
    }

    // --- Estimates ---
    pub async fn list_estimates(&self, tenant_id: Uuid) -> Result<Vec<Estimate>, Error> {
        sqlx::query_as::<_, Estimate>("SELECT * FROM estimates WHERE tenant_id = $1 ORDER BY date DESC")
            .bind(tenant_id).fetch_all(&self.pool).await.map_err(|e| Error::Database(e.to_string()))
    }

    pub async fn create_estimate(&self, tenant_id: Uuid, est: CreateEstimate) -> Result<Estimate, Error> {
        sqlx::query_as::<_, Estimate>(
            "INSERT INTO estimates (tenant_id, customer_id, estimate_number, date, expiration_date, total_amount, notes) VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), $5, $6, $7) RETURNING *")
            .bind(tenant_id).bind(est.customer_id).bind(est.estimate_number).bind(est.date)
            .bind(est.expiration_date).bind(est.total_amount).bind(est.notes)
            .fetch_one(&self.pool).await.map_err(|e| Error::Database(e.to_string()))
    }

    // --- Bills ---
    pub async fn list_bills(&self, tenant_id: Uuid) -> Result<Vec<Bill>, Error> {
        sqlx::query_as::<_, Bill>("SELECT * FROM bills WHERE tenant_id = $1 ORDER BY date DESC")
            .bind(tenant_id).fetch_all(&self.pool).await.map_err(|e| Error::Database(e.to_string()))
    }

    pub async fn create_bill(&self, tenant_id: Uuid, bill: CreateBill) -> Result<Bill, Error> {
        sqlx::query_as::<_, Bill>(
            "INSERT INTO bills (tenant_id, supplier_id, bill_number, date, due_date, total_amount, terms, notes) VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), $5, $6, $7, $8) RETURNING *")
            .bind(tenant_id).bind(bill.supplier_id).bind(bill.bill_number).bind(bill.date)
            .bind(bill.due_date).bind(bill.total_amount).bind(bill.terms).bind(bill.notes)
            .fetch_one(&self.pool).await.map_err(|e| Error::Database(e.to_string()))
    }

    // --- Sales Receipts ---
    pub async fn list_sales_receipts(&self, tenant_id: Uuid) -> Result<Vec<SalesReceipt>, Error> {
        sqlx::query_as::<_, SalesReceipt>("SELECT * FROM sales_receipts WHERE tenant_id = $1 ORDER BY date DESC")
            .bind(tenant_id).fetch_all(&self.pool).await.map_err(|e| Error::Database(e.to_string()))
    }

    pub async fn create_sales_receipt(&self, tenant_id: Uuid, sr: CreateSalesReceipt) -> Result<SalesReceipt, Error> {
        sqlx::query_as::<_, SalesReceipt>(
            "INSERT INTO sales_receipts (tenant_id, customer_id, receipt_number, total_amount, payment_method, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *")
            .bind(tenant_id).bind(sr.customer_id).bind(sr.receipt_number)
            .bind(sr.total_amount).bind(sr.payment_method).bind(sr.notes)
            .fetch_one(&self.pool).await.map_err(|e| Error::Database(e.to_string()))
    }

    // --- Credit Memos ---
    pub async fn list_credit_memos(&self, tenant_id: Uuid) -> Result<Vec<CreditMemo>, Error> {
        sqlx::query_as::<_, CreditMemo>("SELECT * FROM credit_memos WHERE tenant_id = $1 ORDER BY date DESC")
            .bind(tenant_id).fetch_all(&self.pool).await.map_err(|e| Error::Database(e.to_string()))
    }

    pub async fn create_credit_memo(&self, tenant_id: Uuid, cm: CreateCreditMemo) -> Result<CreditMemo, Error> {
        sqlx::query_as::<_, CreditMemo>(
            "INSERT INTO credit_memos (tenant_id, customer_id, memo_number, total_amount, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *")
            .bind(tenant_id).bind(cm.customer_id).bind(cm.memo_number)
            .bind(cm.total_amount).bind(cm.notes)
            .fetch_one(&self.pool).await.map_err(|e| Error::Database(e.to_string()))
    }

    // --- Journal Entries ---
    pub async fn list_journal_entries(&self, tenant_id: Uuid) -> Result<Vec<JournalEntry>, Error> {
        sqlx::query_as::<_, JournalEntry>("SELECT * FROM journal_entries WHERE tenant_id = $1 ORDER BY date DESC")
            .bind(tenant_id).fetch_all(&self.pool).await.map_err(|e| Error::Database(e.to_string()))
    }

    pub async fn list_journal_entry_lines(&self, entry_id: Uuid) -> Result<Vec<JournalEntryLine>, Error> {
        sqlx::query_as::<_, JournalEntryLine>("SELECT * FROM journal_entry_lines WHERE entry_id = $1 ORDER BY sort_order")
            .bind(entry_id).fetch_all(&self.pool).await.map_err(|e| Error::Database(e.to_string()))
    }

    pub async fn create_journal_entry(&self, tenant_id: Uuid, je: CreateJournalEntry) -> Result<JournalEntry, Error> {
        let mut tx = self.pool.begin().await.map_err(|e| Error::Database(e.to_string()))?;
        let entry = sqlx::query_as::<_, JournalEntry>(
            "INSERT INTO journal_entries (tenant_id, entry_number, date, memo, is_adjusting) VALUES ($1, $2, COALESCE($3, CURRENT_DATE), $4, $5) RETURNING *")
            .bind(tenant_id).bind(&je.entry_number).bind(je.date).bind(&je.memo).bind(je.is_adjusting)
            .fetch_one(&mut *tx).await.map_err(|e| Error::Database(e.to_string()))?;

        for (i, line) in je.lines.iter().enumerate() {
            sqlx::query("INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, memo, sort_order) VALUES ($1, $2, $3, $4, $5, $6)")
                .bind(entry.id).bind(line.account_id).bind(line.debit).bind(line.credit).bind(&line.memo).bind(i as i32)
                .execute(&mut *tx).await.map_err(|e| Error::Database(e.to_string()))?;
        }
        tx.commit().await.map_err(|e| Error::Database(e.to_string()))?;
        Ok(entry)
    }

    // --- Checks ---
    pub async fn list_checks(&self, tenant_id: Uuid) -> Result<Vec<Check>, Error> {
        sqlx::query_as::<_, Check>("SELECT * FROM checks WHERE tenant_id = $1 ORDER BY date DESC")
            .bind(tenant_id).fetch_all(&self.pool).await.map_err(|e| Error::Database(e.to_string()))
    }

    pub async fn create_check(&self, tenant_id: Uuid, chk: CreateCheck) -> Result<Check, Error> {
        sqlx::query_as::<_, Check>(
            "INSERT INTO checks (tenant_id, bank_account_id, payee_name, check_number, total_amount, memo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *")
            .bind(tenant_id).bind(chk.bank_account_id).bind(chk.payee_name)
            .bind(chk.check_number).bind(chk.total_amount).bind(chk.memo)
            .fetch_one(&self.pool).await.map_err(|e| Error::Database(e.to_string()))
    }
}
