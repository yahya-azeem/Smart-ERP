use axum::{
    extract::{Request, State},
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::Response,
};
use jsonwebtoken::{decode, DecodingKey, Validation};
use smart_erp_core::models::auth::Claims;
use crate::state::AppState;
use uuid::Uuid;

pub async fn auth_middleware(
    State(state): State<AppState>,
    headers: HeaderMap,
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // 1. Extract Authorization Header
    let auth_header = headers
        .get("Authorization")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("Bearer "))
        .ok_or(StatusCode::UNAUTHORIZED)?;

    // 2. Decode & Verify JWT
    let token_data = decode::<Claims>(
        auth_header,
        &DecodingKey::from_secret(state.jwt_secret.as_bytes()),
        &Validation::default(),
    )
    .map_err(|_| StatusCode::UNAUTHORIZED)?;

    // 3. Extract x-tenant-id Header
    let tenant_header = headers
        .get("x-tenant-id")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| Uuid::parse_str(value).ok())
        .ok_or(StatusCode::BAD_REQUEST)?;

    // 4. Verify Tenant Match (Security Critical)
    if token_data.claims.tenant_id != tenant_header {
        return Err(StatusCode::FORBIDDEN);
    }

    // 5. Store Claims in Request Extensions (Optional, for handlers to use)
    request.extensions_mut().insert(token_data.claims);

    Ok(next.run(request).await)
}
