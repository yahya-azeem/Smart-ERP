mod handlers;
mod state;
mod error;
mod middleware;

use axum::{
    routing::{get, post, delete},
    Router,
    middleware as axum_middleware,
};
use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;
use tower_http::trace::TraceLayer;
use tower_http::cors::{CorsLayer, Any};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use state::AppState;

#[cfg(target_os = "openbsd")]
mod openbsd {
    use pledge::pledge;
    use unveil::unveil;

    pub fn secure_process() {
        // OpenBSD Security Primitives
        if let Err(e) = unveil("/etc/ssl", "r") { eprintln!("unveil /etc/ssl failed: {}", e); }
        if let Err(e) = unveil("/etc/resolv.conf", "r") { eprintln!("unveil /etc/resolv.conf failed: {}", e); }
        if let Err(e) = unveil("", "") { eprintln!("unveil lock failed: {}", e); }

        match pledge("stdio inet rpath dns", None) {
            Ok(_) => println!("OpenBSD pledge() active: stdio inet rpath dns"),
            Err(e) => {
                eprintln!("Failed to pledge: {}", e);
                std::process::exit(1);
            }
        }
    }
}

#[tokio::main]
async fn main() {
    // Activate OpenBSD Security
    #[cfg(target_os = "openbsd")]
    openbsd::secure_process();

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
        .max_connections(20)
        .connect(&database_url)
        .await
        .expect("Failed to connect to database");

    let jwt_secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());

    let state = AppState { pool, jwt_secret };

    // Public Routes (No Auth)
    let public_routes = Router::new()
        .route("/", get(root))
        .route("/api/auth/login", post(handlers::auth::login))
        .route("/api/auth/register", post(handlers::auth::register));

    // Protected Routes (Require Auth + Tenant Match)
    let protected_routes = Router::new()
        // Inventory
        .route("/api/products", get(handlers::inventory::list_products).post(handlers::inventory::create_product))
        // Purchasing
        .route("/api/purchasing/suppliers", get(handlers::purchasing::list_suppliers).post(handlers::purchasing::create_supplier))
        .route("/api/purchasing/orders", get(handlers::purchasing::list_purchase_orders).post(handlers::purchasing::create_purchase_order))
        .route("/api/purchasing/orders/:id/receive", post(handlers::purchasing::receive_purchase_order))
        // Manufacturing
        .route("/api/manufacturing/recipes", get(handlers::manufacturing::list_recipes).post(handlers::manufacturing::create_recipe))
        .route("/api/manufacturing/work-orders", get(handlers::manufacturing::list_work_orders).post(handlers::manufacturing::create_work_order))
        .route("/api/manufacturing/work-orders/:id/complete", post(handlers::manufacturing::complete_work_order))
        // Sales
        .route("/api/sales/customers", post(handlers::sales::create_customer))
        .route("/api/sales/orders", post(handlers::sales::create_sales_order))
        .route("/api/sales/orders/:id/ship", post(handlers::sales::ship_sales_order))
        .route("/api/sales/trend", get(handlers::sales::get_sales_trend))
        // Accounting
        .route("/api/accounting/invoices", get(handlers::accounting::list_invoices).post(handlers::accounting::create_invoice))
        .route("/api/accounting/payments", get(handlers::accounting::list_payments).post(handlers::accounting::record_payment))
        // Chart of Accounts
        .route("/api/accounts", get(handlers::chart_of_accounts::list_accounts).post(handlers::chart_of_accounts::create_account))
        .route("/api/accounts/:id", delete(handlers::chart_of_accounts::delete_account))
        // Employees
        .route("/api/employees", get(handlers::employee::list_employees).post(handlers::employee::create_employee))
        .route("/api/employees/:id", delete(handlers::employee::delete_employee))
        // Phase 2: Transactions
        .route("/api/estimates", get(handlers::transactions::list_estimates).post(handlers::transactions::create_estimate))
        .route("/api/bills", get(handlers::transactions::list_bills).post(handlers::transactions::create_bill))
        .route("/api/sales-receipts", get(handlers::transactions::list_sales_receipts).post(handlers::transactions::create_sales_receipt))
        .route("/api/credit-memos", get(handlers::transactions::list_credit_memos).post(handlers::transactions::create_credit_memo))
        .route("/api/journal-entries", get(handlers::transactions::list_journal_entries).post(handlers::transactions::create_journal_entry))
        .route("/api/checks", get(handlers::transactions::list_checks).post(handlers::transactions::create_check))
        // Phase 3: Reports
        .route("/api/reports/profit-loss", get(handlers::reports::profit_and_loss))
        .route("/api/reports/balance-sheet", get(handlers::reports::balance_sheet))
        .route("/api/reports/trial-balance", get(handlers::reports::trial_balance))
        .route("/api/reports/ar-aging", get(handlers::reports::ar_aging))
        .route("/api/reports/ap-aging", get(handlers::reports::ap_aging))
        .route("/api/reports/sales-summary", get(handlers::reports::sales_summary))
        
        .route_layer(axum_middleware::from_fn_with_state(state.clone(), middleware::auth::auth_middleware));

    // Merge Routes
    let app = Router::new()
        .merge(public_routes)
        .merge(protected_routes)
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
