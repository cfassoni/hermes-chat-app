use rusqlite::{params, Connection, Result};
use std::time::{SystemTime, UNIX_EPOCH};

fn current_timestamp_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64
}

pub fn init_schema(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        r#"
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS workspaces (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            custom_system_prompt TEXT,
            scoped_cwd TEXT,
            default_profile_id TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            model TEXT NOT NULL,
            pinned INTEGER NOT NULL DEFAULT 0,
            system_prompt TEXT,
            temperature REAL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_sessions_workspace_id ON sessions(workspace_id);

        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            thought TEXT,
            token_usage_json TEXT,
            created_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);

        CREATE TABLE IF NOT EXISTS attachments (
            id TEXT PRIMARY KEY,
            message_id TEXT REFERENCES messages(id) ON DELETE CASCADE,
            file_name TEXT NOT NULL,
            file_type TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            local_stored_path TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            created_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON attachments(message_id);

        CREATE TABLE IF NOT EXISTS connection_profiles (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            base_url TEXT NOT NULL,
            api_key_secure_ref TEXT,
            model_name TEXT NOT NULL,
            params_json TEXT,
            limits_json TEXT,
            is_default INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS tool_audit_log (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
            tool_name TEXT NOT NULL,
            command_payload TEXT NOT NULL,
            hitl_status TEXT NOT NULL,
            exit_code INTEGER,
            executed_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_tool_audit_session_id ON tool_audit_log(session_id);
        "#,
    )?;

    seed_defaults_if_empty(conn)?;

    Ok(())
}

pub fn seed_defaults_if_empty(conn: &Connection) -> Result<()> {
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM workspaces", [], |r| r.get(0))?;

    if count == 0 {
        let now = current_timestamp_ms();

        // 1. Default Workspace
        let default_ws_id = "ws-default";
        conn.execute(
            "INSERT INTO workspaces (id, name, custom_system_prompt, scoped_cwd, default_profile_id, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                default_ws_id,
                "General Workspace",
                Option::<String>::None,
                Option::<String>::None,
                Option::<String>::None,
                now,
                now,
            ],
        )?;

        // 2. Default Session
        let default_session_id = "session-default";
        conn.execute(
            "INSERT INTO sessions (id, workspace_id, title, model, pinned, system_prompt, temperature, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                default_session_id,
                default_ws_id,
                "Welcome to Hermes",
                "hermes-3-llama-3.1-8b",
                0,
                Option::<String>::None,
                0.7,
                now,
                now,
            ],
        )?;

        // 3. Welcome Message
        conn.execute(
            "INSERT INTO messages (id, session_id, role, content, thought, token_usage_json, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                "msg-welcome",
                default_session_id,
                "assistant",
                "Hello! I am **Hermes**, your autonomous AI engineering assistant. How can I assist you today?",
                "Hermes local SQLite initialized. Storage and state ready.",
                Option::<String>::None,
                now,
            ],
        )?;

        // 4. Default Profile
        conn.execute(
            "INSERT INTO connection_profiles (id, name, base_url, api_key_secure_ref, model_name, params_json, limits_json, is_default)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                "profile-default",
                "Local Hermes Node",
                "http://127.0.0.1:8080/v1",
                Option::<String>::None,
                "hermes-3-llama-3.1-8b",
                Option::<String>::None,
                Option::<String>::None,
                1,
            ],
        )?;
    }

    Ok(())
}
