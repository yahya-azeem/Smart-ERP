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
            smart_erp_core::error::Error::Database(msg) => {
                // CVE-04: Log real error server-side, return generic message to client
                tracing::error!("Database error: {}", msg);
                (StatusCode::INTERNAL_SERVER_ERROR, "An internal error occurred".to_string())
            },
            smart_erp_core::error::Error::Unauthorized => (StatusCode::UNAUTHORIZED, "Unauthorized".to_string()),
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
