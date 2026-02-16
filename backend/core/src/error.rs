use thiserror::Error;

#[derive(Error, Debug)]
pub enum Error {
    #[error("Database error: {0}")]
    Database(String),
    #[error("Entity not found: {0}")]
    NotFound(String),
    #[error("Business rule violation: {0}")]
    BusinessRule(String),
    #[error("Unauthorized access")]
    Unauthorized,
    #[error("Validation error: {0}")]
    Validation(String),
}
