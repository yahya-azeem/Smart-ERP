use smart_erp_core::models::chart_of_accounts::{Account, CreateAccount};
use smart_erp_core::error::Error;
use sqlx::PgPool;
use uuid::Uuid;

pub struct PostgresAccountsRepository {
    pool: PgPool,
}

impl PostgresAccountsRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn list_accounts(&self, tenant_id: Uuid) -> Result<Vec<Account>, Error> {
        let records = sqlx::query_as::<_, Account>(
            r#"
            SELECT * FROM accounts
            WHERE tenant_id = $1
            ORDER BY account_number, name
            "#
        )
        .bind(tenant_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Error::Database(e.to_string()))?;
        Ok(records)
    }

    pub async fn get_account(&self, tenant_id: Uuid, id: Uuid) -> Result<Account, Error> {
        let record = sqlx::query_as::<_, Account>(
            "SELECT * FROM accounts WHERE id = $1 AND tenant_id = $2"
        )
        .bind(id)
        .bind(tenant_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Error::Database(e.to_string()))?
        .ok_or(Error::NotFound("Account not found".to_string()))?;
        Ok(record)
    }

    pub async fn create_account(&self, tenant_id: Uuid, account: CreateAccount) -> Result<Account, Error> {
        let record = sqlx::query_as::<_, Account>(
            r#"
            INSERT INTO accounts (tenant_id, parent_id, account_number, name, account_type, detail_type, description)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            "#
        )
        .bind(tenant_id)
        .bind(account.parent_id)
        .bind(account.account_number)
        .bind(account.name)
        .bind(account.account_type)
        .bind(account.detail_type)
        .bind(account.description)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Error::Database(e.to_string()))?;
        Ok(record)
    }

    pub async fn delete_account(&self, tenant_id: Uuid, id: Uuid) -> Result<(), Error> {
        let result = sqlx::query(
            "DELETE FROM accounts WHERE id = $1 AND tenant_id = $2 AND is_system = false"
        )
        .bind(id)
        .bind(tenant_id)
        .execute(&self.pool)
        .await
        .map_err(|e| Error::Database(e.to_string()))?;
        if result.rows_affected() == 0 {
            return Err(Error::NotFound("Account not found or is a system account".to_string()));
        }
        Ok(())
    }
}
