use thiserror::Error;

#[derive(Error, Debug)]
pub enum SharedError {
    #[error("Unknown error")]
    Unknown,
}
