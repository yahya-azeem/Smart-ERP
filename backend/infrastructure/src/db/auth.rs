use async_trait::async_trait;
use smart_erp_core::models::auth::{
    AuthResponse, AuthService, Claims, LoginRequest, RegisterRequest, User, Role,
};
use smart_erp_core::error::Error;
use sqlx::PgPool;
use uuid::Uuid;
use argon2::{
    password_hash::{
        rand_core::OsRng,
        PasswordHash, PasswordHasher, PasswordVerifier, SaltString
    },
    Argon2
};
use jsonwebtoken::{encode, EncodingKey, Header};
use chrono::{Utc, Duration};

pub struct PostgresAuthRepository {
    pool: PgPool,
    jwt_secret: String,
}

impl PostgresAuthRepository {
    pub fn new(pool: PgPool, jwt_secret: String) -> Self {
        Self { pool, jwt_secret }
    }
}

#[async_trait]
impl AuthService for PostgresAuthRepository {
    async fn register(
        &self,
        tenant_id: Uuid,
        req: RegisterRequest,
    ) -> Result<User, Error> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        let password_hash = argon2
            .hash_password(req.password.as_bytes(), &salt)
            .map_err(|e| Error::Validation(e.to_string()))?
            .to_string();

        let user = sqlx::query_as::<_, User>(
            r#"
            INSERT INTO users (tenant_id, username, password_hash, role)
            VALUES ($1, $2, $3, $4)
            RETURNING *
            "#
        )
        .bind(tenant_id)
        .bind(req.username)
        .bind(password_hash)
        .bind(req.role.to_string())
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Error::Database(e.to_string()))?;

        Ok(user)
    }

    async fn login(
        &self,
        tenant_id: Uuid,
        req: LoginRequest,
    ) -> Result<AuthResponse, Error> {
        let user = sqlx::query_as::<_, User>(
            r#"
            SELECT * FROM users WHERE tenant_id = $1 AND username = $2
            "#
        )
        .bind(tenant_id)
        .bind(req.username)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Error::Database(e.to_string()))?
        .ok_or(Error::Unauthorized)?;

        let parsed_hash = PasswordHash::new(&user.password_hash)
            .map_err(|_| Error::Unauthorized)?;
        
        Argon2::default()
            .verify_password(req.password.as_bytes(), &parsed_hash)
            .map_err(|_| Error::Unauthorized)?;

        let expiration = Utc::now()
            .checked_add_signed(Duration::hours(24))
            .expect("valid timestamp")
            .timestamp();

        let claims = Claims {
            sub: user.id,
            tenant_id,
            role: user.role.clone(),
            exp: expiration as usize,
        };

        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.jwt_secret.as_bytes()),
        )
        .map_err(|e| Error::Validation(e.to_string()))?;

        Ok(AuthResponse { token, user })
    }
}
