use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

pub struct AppError(pub smart_erp_core::error::Error);

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self.0 {
            smart_erp_core::error::Error::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            smart_erp_core::error::Error::BusinessRule(msg) => (StatusCode::BAD_REQUEST, msg),
            smart_erp_core::error::Error::Database(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
            _ => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Internal Server Error".to_string(),
            ),
        };

        (status, Json(json!({ "error": message }))).into_response()
    }
}

impl From<smart_erp_core::error::Error> for AppError {
    fn from(inner: smart_erp_core::error::Error) -> Self {
        AppError(inner)
    }
}
