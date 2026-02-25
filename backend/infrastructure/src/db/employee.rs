use smart_erp_core::models::employee::{Employee, CreateEmployee};
use smart_erp_core::error::Error;
use sqlx::PgPool;
use uuid::Uuid;

pub struct PostgresEmployeeRepository {
    pool: PgPool,
}

impl PostgresEmployeeRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn list_employees(&self, tenant_id: Uuid) -> Result<Vec<Employee>, Error> {
        let records = sqlx::query_as::<_, Employee>(
            r#"
            SELECT * FROM employees
            WHERE tenant_id = $1
            ORDER BY last_name, first_name
            "#
        )
        .bind(tenant_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Error::Database(e.to_string()))?;
        Ok(records)
    }

    pub async fn get_employee(&self, tenant_id: Uuid, id: Uuid) -> Result<Employee, Error> {
        let record = sqlx::query_as::<_, Employee>(
            "SELECT * FROM employees WHERE id = $1 AND tenant_id = $2"
        )
        .bind(id)
        .bind(tenant_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Error::Database(e.to_string()))?
        .ok_or(Error::NotFound("Employee not found".to_string()))?;
        Ok(record)
    }

    pub async fn create_employee(&self, tenant_id: Uuid, employee: CreateEmployee) -> Result<Employee, Error> {
        let record = sqlx::query_as::<_, Employee>(
            r#"
            INSERT INTO employees (tenant_id, first_name, last_name, email, phone, address, ssn_last4, hire_date, department, job_title, pay_type, pay_rate)
            VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, CURRENT_DATE), $9, $10, $11, $12)
            RETURNING *
            "#
        )
        .bind(tenant_id)
        .bind(&employee.first_name)
        .bind(&employee.last_name)
        .bind(&employee.email)
        .bind(&employee.phone)
        .bind(&employee.address)
        .bind(&employee.ssn_last4)
        .bind(employee.hire_date)
        .bind(&employee.department)
        .bind(&employee.job_title)
        .bind(&employee.pay_type)
        .bind(employee.pay_rate)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Error::Database(e.to_string()))?;
        Ok(record)
    }

    pub async fn delete_employee(&self, tenant_id: Uuid, id: Uuid) -> Result<(), Error> {
        let result = sqlx::query(
            "DELETE FROM employees WHERE id = $1 AND tenant_id = $2"
        )
        .bind(id)
        .bind(tenant_id)
        .execute(&self.pool)
        .await
        .map_err(|e| Error::Database(e.to_string()))?;
        if result.rows_affected() == 0 {
            return Err(Error::NotFound("Employee not found".to_string()));
        }
        Ok(())
    }
}
