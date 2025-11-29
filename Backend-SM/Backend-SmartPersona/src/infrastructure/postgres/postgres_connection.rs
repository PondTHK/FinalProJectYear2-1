use anyhow::{Context, Result};
use diesel::{
    PgConnection, RunQueryDsl,
    r2d2::{ConnectionManager, CustomizeConnection, Pool},
};

#[derive(Debug)]
struct ResetConnection;

impl CustomizeConnection<PgConnection, diesel::r2d2::Error> for ResetConnection {
    fn on_acquire(&self, conn: &mut PgConnection) -> std::result::Result<(), diesel::r2d2::Error> {
      
        diesel::sql_query("RESET ALL;")
            .execute(conn)
            .map_err(|e| {
                tracing::warn!("Failed to RESET ALL connection state: {}, trying DISCARD ALL", e);
                // If RESET ALL fails, try DISCARD ALL as fallback
                diesel::r2d2::Error::QueryError(e)
            })?;
        
        // Also explicitly deallocate all prepared statements
        // This handles any remaining prepared statements
        let _ = diesel::sql_query("DEALLOCATE ALL;").execute(conn);
        
        // Finally, discard all session state
        diesel::sql_query("DISCARD ALL;")
            .execute(conn)
            .map(|_| ())
            .map_err(|e| {
                tracing::warn!("Failed to reset connection state: {}", e);
                diesel::r2d2::Error::QueryError(e)
            })
    }
}

pub type DbPool = Pool<ConnectionManager<PgConnection>>;

pub fn create_pool(database_url: &str) -> Result<DbPool> {
    use std::time::Duration;
    
    let manager = ConnectionManager::<PgConnection>::new(database_url);

    let pool = Pool::builder()
        .max_size(1) // Reduced pool size to minimize connection reuse issues
        .min_idle(None) // Don't keep idle connections - force new connections
        .idle_timeout(Some(Duration::from_secs(10))) // Close idle connections after 30 seconds (very aggressive)
        .max_lifetime(Some(Duration::from_secs(300))) // Close connections after 5 minutes (very aggressive)
        .test_on_check_out(true) // Test connections before use
        .connection_customizer(Box::new(ResetConnection)) // Reset session state on acquire
        .build(manager)
        .context("Failed to create database connection pool.")?;

    Ok(pool)
}
