use smart_erp_core::models::reports::*;
use smart_erp_core::error::Error;
use sqlx::PgPool;
use uuid::Uuid;
use rust_decimal::Decimal;

pub struct PostgresReportsRepository {
    pool: PgPool,
}

impl PostgresReportsRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    // --- Profit & Loss ---
    pub async fn profit_and_loss(&self, tenant_id: Uuid) -> Result<ProfitAndLoss, Error> {
        let income = self.accounts_by_types(tenant_id, &["INCOME", "OTHER_INCOME"]).await?;
        let cogs = self.accounts_by_types(tenant_id, &["COST_OF_GOODS_SOLD"]).await?;
        let expenses = self.accounts_by_types(tenant_id, &["EXPENSE", "OTHER_EXPENSE"]).await?;

        let total_income: Decimal = income.iter().map(|l| l.amount).sum();
        let total_cogs: Decimal = cogs.iter().map(|l| l.amount).sum();
        let total_expenses: Decimal = expenses.iter().map(|l| l.amount).sum();
        let gross_profit = total_income - total_cogs;
        let net_income = gross_profit - total_expenses;

        Ok(ProfitAndLoss { income, cogs, expenses, total_income, total_cogs, gross_profit, total_expenses, net_income })
    }

    // --- Balance Sheet ---
    pub async fn balance_sheet(&self, tenant_id: Uuid) -> Result<BalanceSheet, Error> {
        let assets = self.accounts_by_types(tenant_id, &["BANK", "ACCOUNTS_RECEIVABLE", "OTHER_CURRENT_ASSET", "FIXED_ASSET", "OTHER_ASSET"]).await?;
        let liabilities = self.accounts_by_types(tenant_id, &["ACCOUNTS_PAYABLE", "CREDIT_CARD", "OTHER_CURRENT_LIABILITY", "LONG_TERM_LIABILITY"]).await?;
        let equity = self.accounts_by_types(tenant_id, &["EQUITY"]).await?;

        let total_assets: Decimal = assets.iter().map(|l| l.amount).sum();
        let total_liabilities: Decimal = liabilities.iter().map(|l| l.amount).sum();
        let total_equity: Decimal = equity.iter().map(|l| l.amount).sum();

        Ok(BalanceSheet { assets, liabilities, equity, total_assets, total_liabilities, total_equity })
    }

    // --- Trial Balance ---
    pub async fn trial_balance(&self, tenant_id: Uuid) -> Result<TrialBalance, Error> {
        let rows = sqlx::query_as::<_, (String, String, String, Decimal)>(
            "SELECT COALESCE(account_number,''), name, account_type, balance FROM accounts WHERE tenant_id = $1 AND is_active = true ORDER BY account_number"
        ).bind(tenant_id).fetch_all(&self.pool).await.map_err(|e| Error::Database(e.to_string()))?;

        let mut lines = Vec::new();
        let mut total_debits = Decimal::ZERO;
        let mut total_credits = Decimal::ZERO;

        for (num, name, atype, bal) in rows {
            let is_debit_normal = matches!(atype.as_str(), "BANK" | "ACCOUNTS_RECEIVABLE" | "OTHER_CURRENT_ASSET" | "FIXED_ASSET" | "OTHER_ASSET" | "COST_OF_GOODS_SOLD" | "EXPENSE" | "OTHER_EXPENSE");
            let (debit, credit) = if is_debit_normal {
                total_debits += bal;
                (bal, Decimal::ZERO)
            } else {
                total_credits += bal;
                (Decimal::ZERO, bal)
            };
            lines.push(TrialBalanceLine { account_number: num, account_name: name, account_type: atype, debit, credit });
        }

        Ok(TrialBalance { lines, total_debits, total_credits })
    }

    // --- A/R Aging ---
    pub async fn ar_aging(&self, tenant_id: Uuid) -> Result<AgingReport, Error> {
        let rows = sqlx::query_as::<_, (String, String, Decimal, Decimal, i32)>(
            "SELECT c.name, i.invoice_number, i.total_amount, i.amount_paid, CURRENT_DATE - i.due_date as days_past
             FROM invoices i JOIN customers c ON i.customer_id = c.id
             WHERE i.tenant_id = $1 AND i.status != 'PAID' AND i.status != 'CANCELLED'
             ORDER BY c.name, days_past DESC"
        ).bind(tenant_id).fetch_all(&self.pool).await.map_err(|e| Error::Database(e.to_string()))?;

        let mut lines: Vec<AgingLine> = Vec::new();
        let (mut tc, mut t1, mut t2, mut t3, mut t4) = (Decimal::ZERO, Decimal::ZERO, Decimal::ZERO, Decimal::ZERO, Decimal::ZERO);

        for (name, _inv_num, total, paid, days) in rows {
            let balance = total - paid;
            let line = lines.iter_mut().find(|l| l.name == name);
            let entry = match line {
                Some(l) => l,
                None => { lines.push(AgingLine { name: name.clone(), current: Decimal::ZERO, days_1_30: Decimal::ZERO, days_31_60: Decimal::ZERO, days_61_90: Decimal::ZERO, over_90: Decimal::ZERO, total: Decimal::ZERO }); lines.last_mut().unwrap() }
            };
            entry.total += balance;
            if days <= 0 { entry.current += balance; tc += balance; }
            else if days <= 30 { entry.days_1_30 += balance; t1 += balance; }
            else if days <= 60 { entry.days_31_60 += balance; t2 += balance; }
            else if days <= 90 { entry.days_61_90 += balance; t3 += balance; }
            else { entry.over_90 += balance; t4 += balance; }
        }

        Ok(AgingReport { grand_total: tc + t1 + t2 + t3 + t4, total_current: tc, total_1_30: t1, total_31_60: t2, total_61_90: t3, total_over_90: t4, lines })
    }

    // --- A/P Aging ---
    pub async fn ap_aging(&self, tenant_id: Uuid) -> Result<AgingReport, Error> {
        let rows = sqlx::query_as::<_, (String, String, Decimal, Decimal, i32)>(
            "SELECT s.name, b.bill_number, b.total_amount, b.amount_paid, CURRENT_DATE - b.due_date as days_past
             FROM bills b JOIN suppliers s ON b.supplier_id = s.id
             WHERE b.tenant_id = $1 AND b.status != 'PAID'
             ORDER BY s.name, days_past DESC"
        ).bind(tenant_id).fetch_all(&self.pool).await.map_err(|e| Error::Database(e.to_string()))?;

        let mut lines: Vec<AgingLine> = Vec::new();
        let (mut tc, mut t1, mut t2, mut t3, mut t4) = (Decimal::ZERO, Decimal::ZERO, Decimal::ZERO, Decimal::ZERO, Decimal::ZERO);

        for (name, _bill_num, total, paid, days) in rows {
            let balance = total - paid;
            let line = lines.iter_mut().find(|l| l.name == name);
            let entry = match line {
                Some(l) => l,
                None => { lines.push(AgingLine { name: name.clone(), current: Decimal::ZERO, days_1_30: Decimal::ZERO, days_31_60: Decimal::ZERO, days_61_90: Decimal::ZERO, over_90: Decimal::ZERO, total: Decimal::ZERO }); lines.last_mut().unwrap() }
            };
            entry.total += balance;
            if days <= 0 { entry.current += balance; tc += balance; }
            else if days <= 30 { entry.days_1_30 += balance; t1 += balance; }
            else if days <= 60 { entry.days_31_60 += balance; t2 += balance; }
            else if days <= 90 { entry.days_61_90 += balance; t3 += balance; }
            else { entry.over_90 += balance; t4 += balance; }
        }

        Ok(AgingReport { grand_total: tc + t1 + t2 + t3 + t4, total_current: tc, total_1_30: t1, total_31_60: t2, total_61_90: t3, total_over_90: t4, lines })
    }

    // --- Sales Summary ---
    pub async fn sales_summary(&self, tenant_id: Uuid) -> Result<SalesSummary, Error> {
        let row = sqlx::query_as::<_, (Decimal, Decimal, i64)>(
            "SELECT COALESCE(SUM(total_amount), 0), COALESCE(SUM(amount_paid), 0), COUNT(*) FROM invoices WHERE tenant_id = $1"
        ).bind(tenant_id).fetch_one(&self.pool).await.map_err(|e| Error::Database(e.to_string()))?;

        let total_invoiced = row.0;
        let total_collected = row.1;
        let invoice_count = row.2;
        let outstanding = total_invoiced - total_collected;
        let avg_invoice = if invoice_count > 0 { total_invoiced / Decimal::from(invoice_count) } else { Decimal::ZERO };

        let monthly = sqlx::query_as::<_, (String, Decimal, i64)>(
            "SELECT TO_CHAR(date, 'YYYY-MM'), COALESCE(SUM(total_amount), 0), COUNT(*) FROM invoices WHERE tenant_id = $1 GROUP BY TO_CHAR(date, 'YYYY-MM') ORDER BY 1 DESC LIMIT 12"
        ).bind(tenant_id).fetch_all(&self.pool).await.map_err(|e| Error::Database(e.to_string()))?;

        let monthly = monthly.into_iter().map(|(m, r, c)| MonthlySales { month: m, revenue: r, count: c }).collect();

        Ok(SalesSummary { total_invoiced, total_collected, outstanding, invoice_count, avg_invoice, monthly })
    }

    // --- General Ledger ---
    pub async fn general_ledger(&self, tenant_id: Uuid) -> Result<GeneralLedger, Error> {
        let rows = sqlx::query_as::<_, (chrono::NaiveDate, String, String, String, Decimal, Decimal)>(
            "SELECT je.date, COALESCE(a.account_number, ''), a.name, COALESCE(jel.description, je.memo, ''),
                    COALESCE(jel.debit, 0), COALESCE(jel.credit, 0)
             FROM journal_entries je
             JOIN journal_entry_lines jel ON jel.journal_entry_id = je.id
             JOIN accounts a ON a.id = jel.account_id
             WHERE je.tenant_id = $1
             ORDER BY je.date DESC, a.account_number"
        ).bind(tenant_id).fetch_all(&self.pool).await.map_err(|e| Error::Database(e.to_string()))?;

        let mut entries = Vec::new();
        let mut total_debits = Decimal::ZERO;
        let mut total_credits = Decimal::ZERO;

        for (date, acct_num, acct_name, desc, debit, credit) in rows {
            total_debits += debit;
            total_credits += credit;
            entries.push(GeneralLedgerEntry {
                date, account_number: acct_num, account_name: acct_name,
                description: desc, debit, credit, balance: debit - credit, source: "Journal Entry".to_string(),
            });
        }

        Ok(GeneralLedger { entries, total_debits, total_credits })
    }

    // Helper: get accounts by type
    async fn accounts_by_types(&self, tenant_id: Uuid, types: &[&str]) -> Result<Vec<ReportLine>, Error> {
        let type_list: Vec<String> = types.iter().map(|t| t.to_string()).collect();
        let rows = sqlx::query_as::<_, (String, String, Decimal)>(
            "SELECT COALESCE(account_number,''), name, balance FROM accounts WHERE tenant_id = $1 AND account_type = ANY($2) AND is_active = true ORDER BY account_number"
        ).bind(tenant_id).bind(&type_list).fetch_all(&self.pool).await.map_err(|e| Error::Database(e.to_string()))?;

        Ok(rows.into_iter().map(|(n, name, amt)| ReportLine { account_number: n, name, amount: amt }).collect())
    }
}
