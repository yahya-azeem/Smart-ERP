use async_trait::async_trait;
use smart_erp_core::models::manufacturing::{
    CreateRecipe, CreateWorkOrder, ManufacturingService, Recipe, RecipeIngredient, WorkOrder,
    WorkOrderStatus,
};
use smart_erp_core::models::inventory::TransactionType;
use smart_erp_core::error::Error;
use sqlx::{PgPool, Postgres, Transaction};
use uuid::Uuid;

pub struct PostgresManufacturingRepository {
    pool: PgPool,
}

impl PostgresManufacturingRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl ManufacturingService for PostgresManufacturingRepository {
    async fn create_recipe(
        &self,
        tenant_id: Uuid,
        recipe: CreateRecipe,
    ) -> Result<Recipe, Error> {
        let mut tx: Transaction<'_, Postgres> = self.pool.begin().await.map_err(|e| Error::Database(e.to_string()))?;

        let created_recipe = sqlx::query_as::<_, Recipe>(
            r#"
            INSERT INTO recipes (tenant_id, name, output_product_id, output_quantity, description)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            "#
        )
        .bind(tenant_id)
        .bind(recipe.name)
        .bind(recipe.output_product_id)
        .bind(recipe.output_quantity)
        .bind(recipe.description)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| Error::Database(e.to_string()))?;

        for ingredient in recipe.ingredients {
            sqlx::query(
                r#"
                INSERT INTO recipe_ingredients (recipe_id, input_product_id, quantity)
                VALUES ($1, $2, $3)
                "#
            )
            .bind(created_recipe.id)
            .bind(ingredient.input_product_id)
            .bind(ingredient.quantity)
            .execute(&mut *tx)
            .await
            .map_err(|e| Error::Database(e.to_string()))?;
        }

        tx.commit().await.map_err(|e| Error::Database(e.to_string()))?;

        Ok(created_recipe)
    }

    async fn create_work_order(
        &self,
        tenant_id: Uuid,
        work_order: CreateWorkOrder,
    ) -> Result<WorkOrder, Error> {
        let record = sqlx::query_as::<_, WorkOrder>(
            r#"
            INSERT INTO work_orders (tenant_id, recipe_id, quantity, start_date, status)
            VALUES ($1, $2, $3, $4, 'PLANNED')
            RETURNING id, tenant_id, recipe_id, quantity, status as "status: WorkOrderStatus", start_date, end_date, created_at, updated_at
            "#
        )
        .bind(tenant_id)
        .bind(work_order.recipe_id)
        .bind(work_order.quantity)
        .bind(work_order.start_date)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Error::Database(e.to_string()))?;

        Ok(record)
    }

    async fn complete_work_order(
        &self,
        tenant_id: Uuid,
        work_order_id: Uuid,
    ) -> Result<WorkOrder, Error> {
        let mut tx: Transaction<'_, Postgres> = self.pool.begin().await.map_err(|e| Error::Database(e.to_string()))?;

        let work_order = sqlx::query_as::<_, WorkOrder>(
            r#"
            SELECT id, tenant_id, recipe_id, quantity, status as "status: WorkOrderStatus", start_date, end_date, created_at, updated_at
            FROM work_orders
            WHERE id = $1 AND tenant_id = $2
            FOR UPDATE
            "#
        )
        .bind(work_order_id)
        .bind(tenant_id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| Error::Database(e.to_string()))?
        .ok_or(Error::NotFound("Work Order not found".to_string()))?;

        if work_order.status == WorkOrderStatus::Completed || work_order.status == WorkOrderStatus::Cancelled {
            return Err(Error::BusinessRule(format!(
                "Cannot complete work order with status {:?}.",
                work_order.status
            )));
        }

        let updated_work_order = sqlx::query_as::<_, WorkOrder>(
            r#"
            UPDATE work_orders
            SET status = 'COMPLETED', end_date = CURRENT_DATE, updated_at = NOW()
            WHERE id = $1
            RETURNING id, tenant_id, recipe_id, quantity, status as "status: WorkOrderStatus", start_date, end_date, created_at, updated_at
            "#
        )
        .bind(work_order_id)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| Error::Database(e.to_string()))?;

        let recipe = sqlx::query_as::<_, Recipe>(
            r#"
            SELECT * FROM recipes WHERE id = $1
            "#
        )
        .bind(work_order.recipe_id)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| Error::Database(e.to_string()))?;

        let ingredients = sqlx::query_as::<_, RecipeIngredient>(
            r#"
            SELECT * FROM recipe_ingredients WHERE recipe_id = $1
            "#
        )
        .bind(work_order.recipe_id)
        .fetch_all(&mut *tx)
        .await
        .map_err(|e| Error::Database(e.to_string()))?;

        for ingredient in ingredients {
            let amount_needed = ingredient.quantity * work_order.quantity;

            sqlx::query(
                r#"
                INSERT INTO inventory_transactions 
                (tenant_id, product_id, quantity, transaction_type, reference_id, notes)
                VALUES ($1, $2, $3, $4, $5, $6)
                "#
            )
            .bind(tenant_id)
            .bind(ingredient.input_product_id)
            .bind(amount_needed)
            .bind(TransactionType::ProductionOut)
            .bind(work_order_id)
            .bind(format!("Used for WO {}", work_order_id))
            .execute(&mut *tx)
            .await
            .map_err(|e| Error::Database(e.to_string()))?;

            sqlx::query(
                r#"
                UPDATE products
                SET stock_quantity = stock_quantity - $1, updated_at = NOW()
                WHERE id = $2 AND tenant_id = $3
                "#
            )
            .bind(amount_needed)
            .bind(ingredient.input_product_id)
            .bind(tenant_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| Error::Database(e.to_string()))?;
        }

        let amount_produced = recipe.output_quantity * work_order.quantity;

        sqlx::query(
            r#"
            INSERT INTO inventory_transactions 
            (tenant_id, product_id, quantity, transaction_type, reference_id, notes)
            VALUES ($1, $2, $3, $4, $5, $6)
            "#
        )
        .bind(tenant_id)
        .bind(recipe.output_product_id)
        .bind(amount_produced)
        .bind(TransactionType::ProductionIn)
        .bind(work_order_id)
        .bind(format!("Produced from WO {}", work_order_id))
        .execute(&mut *tx)
        .await
        .map_err(|e| Error::Database(e.to_string()))?;

        sqlx::query(
            r#"
            UPDATE products
            SET stock_quantity = stock_quantity + $1, updated_at = NOW()
            WHERE id = $2 AND tenant_id = $3
            "#
        )
        .bind(amount_produced)
        .bind(recipe.output_product_id)
        .bind(tenant_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| Error::Database(e.to_string()))?;

        tx.commit().await.map_err(|e| Error::Database(e.to_string()))?;

        Ok(updated_work_order)
    }
}
