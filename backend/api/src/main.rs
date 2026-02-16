mod handlers;
mod state;
mod error;

use axum::{
    routing::{get, post},
    Router,
};
use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;
use tower_http::trace::TraceLayer;
use tower_http::cors::{CorsLayer, Any};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use state::AppState;

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "debug".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Database Connection
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to database");

    let jwt_secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());

    let state = AppState { pool, jwt_secret };

    // Routes
    let app = Router::new()
        .route("/", get(root))
        // Auth
        .route("/api/auth/login", post(handlers::auth::login))
        .route("/api/auth/register", post(handlers::auth::register))
        // Inventory
        .route("/api/products", get(handlers::inventory::list_products).post(handlers::inventory::create_product))
        // Purchasing
        .route("/api/purchasing/suppliers", post(handlers::purchasing::create_supplier))
        .route("/api/purchasing/orders", post(handlers::purchasing::create_purchase_order))
        .route("/api/purchasing/orders/:id/receive", post(handlers::purchasing::receive_purchase_order))
        // Manufacturing
        .route("/api/manufacturing/recipes", post(handlers::manufacturing::create_recipe))
        .route("/api/manufacturing/work-orders", post(handlers::manufacturing::create_work_order))
        .route("/api/manufacturing/work-orders/:id/complete", post(handlers::manufacturing::complete_work_order))
        // Sales
        .route("/api/sales/customers", post(handlers::sales::create_customer))
        .route("/api/sales/orders", post(handlers::sales::create_sales_order))
        .route("/api/sales/orders/:id/ship", post(handlers::sales::ship_sales_order))
        .route("/api/sales/trend", get(handlers::sales::get_sales_trend))
        // Accounting
        .route("/api/accounting/invoices", post(handlers::accounting::create_invoice))
        .route("/api/accounting/payments", post(handlers::accounting::record_payment))
        
        .layer(CorsLayer::new()
            .allow_origin(Any)
            .allow_methods(Any)
            .allow_headers(Any)
        )
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    // Run it
    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    tracing::info!("listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn root() -> &'static str {
    "Smart ERP Rust API is Running 🚀"
}
