use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc, NaiveDate};

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Employee {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub first_name: String,
    pub last_name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub ssn_last4: Option<String>,
    pub hire_date: NaiveDate,
    pub termination_date: Option<NaiveDate>,
    pub department: Option<String>,
    pub job_title: Option<String>,
    pub pay_type: String,
    pub pay_rate: rust_decimal::Decimal,
    pub status: String,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateEmployee {
    pub first_name: String,
    pub last_name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub ssn_last4: Option<String>,
    pub hire_date: Option<NaiveDate>,
    pub department: Option<String>,
    pub job_title: Option<String>,
    pub pay_type: String,
    pub pay_rate: f64,
}

#[derive(Debug, Deserialize)]
pub struct UpdateEmployee {
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub department: Option<String>,
    pub job_title: Option<String>,
    pub pay_type: Option<String>,
    pub pay_rate: Option<f64>,
    pub status: Option<String>,
    pub notes: Option<String>,
}
