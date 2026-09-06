pub mod models;
pub mod schema;

use models::*;
use rusqlite::{params, Connection};
use std::path::Path;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

fn now_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64
}

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new<P: AsRef<Path>>(path: P) -> Result<Self, String> {
        let conn = Connection::open(path).map_err(|e| e.to_string())?;
        schema::init_schema(&conn).map_err(|e| e.to_string())?;
        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    pub fn in_memory() -> Result<Self, String> {
        let conn = Connection::open_in_memory().map_err(|e| e.to_string())?;
        schema::init_schema(&conn).map_err(|e| e.to_string())?;
        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    // --- Workspaces ---

    pub fn get_workspaces(&self) -> Result<Vec<Workspace>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare(
                "SELECT id, name, custom_system_prompt, scoped_cwd, default_profile_id, created_at, updated_at
                 FROM workspaces ORDER BY created_at ASC",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map([], |row| {
                Ok(Workspace {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    custom_system_prompt: row.get(2)?,
                    scoped_cwd: row.get(3)?,
                    default_profile_id: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            })
            .map_err(|e| e.to_string())?;

        let mut workspaces = Vec::new();
        for ws in rows {
            workspaces.push(ws.map_err(|e| e.to_string())?);
        }
        Ok(workspaces)
    }

    pub fn create_workspace(
        &self,
        name: &str,
        scoped_cwd: Option<&str>,
        custom_prompt: Option<&str>,
    ) -> Result<Workspace, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let now = now_ms();
        let ws = Workspace {
            id: format!("ws-{}", Uuid::new_v4().simple()),
            name: name.to_string(),
            custom_system_prompt: custom_prompt.map(|s| s.to_string()),
            scoped_cwd: scoped_cwd.map(|s| s.to_string()),
            default_profile_id: None,
            created_at: now,
            updated_at: now,
        };

        conn.execute(
            "INSERT INTO workspaces (id, name, custom_system_prompt, scoped_cwd, default_profile_id, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                ws.id,
                ws.name,
                ws.custom_system_prompt,
                ws.scoped_cwd,
                ws.default_profile_id,
                ws.created_at,
                ws.updated_at,
            ],
        )
        .map_err(|e| e.to_string())?;

        Ok(ws)
    }

    pub fn delete_workspace(&self, id: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM workspaces WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    // --- Sessions ---

    pub fn get_sessions(&self, workspace_id: &str) -> Result<Vec<Session>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare(
                "SELECT id, workspace_id, title, model, pinned, system_prompt, temperature, created_at, updated_at
                 FROM sessions WHERE workspace_id = ?1 ORDER BY updated_at DESC",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map(params![workspace_id], |row| {
                let pinned_int: i64 = row.get(4)?;
                Ok(Session {
                    id: row.get(0)?,
                    workspace_id: row.get(1)?,
                    title: row.get(2)?,
                    model: row.get(3)?,
                    pinned: pinned_int != 0,
                    system_prompt: row.get(5)?,
                    temperature: row.get(6)?,
                    created_at: row.get(7)?,
                    updated_at: row.get(8)?,
                })
            })
            .map_err(|e| e.to_string())?;

        let mut sessions = Vec::new();
        for s in rows {
            sessions.push(s.map_err(|e| e.to_string())?);
        }
        Ok(sessions)
    }

    pub fn create_session(
        &self,
        workspace_id: &str,
        title: &str,
        model: &str,
    ) -> Result<Session, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let now = now_ms();
        let session = Session {
            id: format!("ses-{}", Uuid::new_v4().simple()),
            workspace_id: workspace_id.to_string(),
            title: title.to_string(),
            model: model.to_string(),
            pinned: false,
            system_prompt: None,
            temperature: Some(0.7),
            created_at: now,
            updated_at: now,
        };

        conn.execute(
            "INSERT INTO sessions (id, workspace_id, title, model, pinned, system_prompt, temperature, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                session.id,
                session.workspace_id,
                session.title,
                session.model,
                0,
                session.system_prompt,
                session.temperature,
                session.created_at,
                session.updated_at,
            ],
        )
        .map_err(|e| e.to_string())?;

        Ok(session)
    }

    pub fn update_session_title(&self, id: &str, title: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let now = now_ms();
        conn.execute(
            "UPDATE sessions SET title = ?1, updated_at = ?2 WHERE id = ?3",
            params![title, now, id],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_session(&self, id: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM sessions WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    // --- Messages ---

    pub fn get_messages(&self, session_id: &str) -> Result<Vec<Message>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare(
                "SELECT id, session_id, role, content, thought, token_usage_json, created_at
                 FROM messages WHERE session_id = ?1 ORDER BY created_at ASC",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map(params![session_id], |row| {
                Ok(Message {
                    id: row.get(0)?,
                    session_id: row.get(1)?,
                    role: row.get(2)?,
                    content: row.get(3)?,
                    thought: row.get(4)?,
                    token_usage_json: row.get(5)?,
                    created_at: row.get(6)?,
                })
            })
            .map_err(|e| e.to_string())?;

        let mut messages = Vec::new();
        for m in rows {
            messages.push(m.map_err(|e| e.to_string())?);
        }
        Ok(messages)
    }

    pub fn save_message(&self, message: &Message) -> Result<Message, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let now = if message.created_at > 0 {
            message.created_at
        } else {
            now_ms()
        };

        let msg = Message {
            id: if message.id.is_empty() {
                format!("msg-{}", Uuid::new_v4().simple())
            } else {
                message.id.clone()
            },
            session_id: message.session_id.clone(),
            role: message.role.clone(),
            content: message.content.clone(),
            thought: message.thought.clone(),
            token_usage_json: message.token_usage_json.clone(),
            created_at: now,
        };

        conn.execute(
            "INSERT INTO messages (id, session_id, role, content, thought, token_usage_json, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
             ON CONFLICT(id) DO UPDATE SET
                content = excluded.content,
                thought = excluded.thought,
                token_usage_json = excluded.token_usage_json",
            params![
                msg.id,
                msg.session_id,
                msg.role,
                msg.content,
                msg.thought,
                msg.token_usage_json,
                msg.created_at,
            ],
        )
        .map_err(|e| e.to_string())?;

        // Touch session updated_at
        let _ = conn.execute(
            "UPDATE sessions SET updated_at = ?1 WHERE id = ?2",
            params![now, msg.session_id],
        );

        Ok(msg)
    }

    pub fn delete_message(&self, id: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM messages WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    // --- Connection Profiles ---

    pub fn get_connection_profiles(&self) -> Result<Vec<ConnectionProfile>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare(
                "SELECT id, name, base_url, api_key_secure_ref, model_name, params_json, limits_json, is_default
                 FROM connection_profiles ORDER BY name ASC",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map([], |row| {
                let is_default_int: i64 = row.get(7)?;
                Ok(ConnectionProfile {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    base_url: row.get(2)?,
                    api_key_secure_ref: row.get(3)?,
                    model_name: row.get(4)?,
                    params_json: row.get(5)?,
                    limits_json: row.get(6)?,
                    is_default: is_default_int != 0,
                })
            })
            .map_err(|e| e.to_string())?;

        let mut profiles = Vec::new();
        for p in rows {
            profiles.push(p.map_err(|e| e.to_string())?);
        }
        Ok(profiles)
    }

    pub fn save_connection_profile(
        &self,
        profile: &ConnectionProfile,
    ) -> Result<ConnectionProfile, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let prof = ConnectionProfile {
            id: if profile.id.is_empty() {
                format!("prof-{}", Uuid::new_v4().simple())
            } else {
                profile.id.clone()
            },
            name: profile.name.clone(),
            base_url: profile.base_url.clone(),
            api_key_secure_ref: profile.api_key_secure_ref.clone(),
            model_name: profile.model_name.clone(),
            params_json: profile.params_json.clone(),
            limits_json: profile.limits_json.clone(),
            is_default: profile.is_default,
        };

        if prof.is_default {
            let _ = conn.execute("UPDATE connection_profiles SET is_default = 0", []);
        }

        conn.execute(
            "INSERT INTO connection_profiles (id, name, base_url, api_key_secure_ref, model_name, params_json, limits_json, is_default)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
             ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                base_url = excluded.base_url,
                api_key_secure_ref = excluded.api_key_secure_ref,
                model_name = excluded.model_name,
                params_json = excluded.params_json,
                limits_json = excluded.limits_json,
                is_default = excluded.is_default",
            params![
                prof.id,
                prof.name,
                prof.base_url,
                prof.api_key_secure_ref,
                prof.model_name,
                prof.params_json,
                prof.limits_json,
                if prof.is_default { 1 } else { 0 },
            ],
        )
        .map_err(|e| e.to_string())?;

        Ok(prof)
    }

    // --- Tool Audit Log ---

    pub fn log_tool_execution(&self, entry: &ToolAuditEntry) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let now = if entry.executed_at > 0 {
            entry.executed_at
        } else {
            now_ms()
        };
        let id = if entry.id.is_empty() {
            format!("audit-{}", Uuid::new_v4().simple())
        } else {
            entry.id.clone()
        };

        conn.execute(
            "INSERT INTO tool_audit_log (id, session_id, tool_name, command_payload, hitl_status, exit_code, executed_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                id,
                entry.session_id,
                entry.tool_name,
                entry.command_payload,
                entry.hitl_status,
                entry.exit_code,
                now,
            ],
        )
        .map_err(|e| e.to_string())?;

        Ok(())
    }

    pub fn get_tool_audit_logs(&self, session_id: &str) -> Result<Vec<ToolAuditEntry>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare(
                "SELECT id, session_id, tool_name, command_payload, hitl_status, exit_code, executed_at
                 FROM tool_audit_log WHERE session_id = ?1 ORDER BY executed_at ASC",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map(params![session_id], |row| {
                Ok(ToolAuditEntry {
                    id: row.get(0)?,
                    session_id: row.get(1)?,
                    tool_name: row.get(2)?,
                    command_payload: row.get(3)?,
                    hitl_status: row.get(4)?,
                    exit_code: row.get(5)?,
                    executed_at: row.get(6)?,
                })
            })
            .map_err(|e| e.to_string())?;

        let mut logs = Vec::new();
        for l in rows {
            logs.push(l.map_err(|e| e.to_string())?);
        }
        Ok(logs)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_in_memory_db_seeding_and_crud() {
        let db = Database::in_memory().expect("failed to init in-memory database");

        // 1. Initial seeds check
        let workspaces = db.get_workspaces().expect("failed to get workspaces");
        assert_eq!(workspaces.len(), 1);
        assert_eq!(workspaces[0].id, "ws-default");

        let sessions = db.get_sessions("ws-default").expect("failed to get sessions");
        assert_eq!(sessions.len(), 1);
        assert_eq!(sessions[0].id, "session-default");

        let messages = db.get_messages("session-default").expect("failed to get messages");
        assert_eq!(messages.len(), 1);
        assert_eq!(messages[0].id, "msg-welcome");
        assert!(messages[0].thought.is_some());

        let profiles = db.get_connection_profiles().expect("failed to get profiles");
        assert_eq!(profiles.len(), 1);
        assert!(profiles[0].is_default);

        // 2. Create new Workspace & Session
        let new_ws = db
            .create_workspace("Custom Dev Space", Some("/app/cwd"), Some("Act as engineer"))
            .expect("create workspace failed");
        assert_eq!(new_ws.name, "Custom Dev Space");

        let new_ses = db
            .create_session(&new_ws.id, "Sprint Planning", "hermes-3-70b")
            .expect("create session failed");
        assert_eq!(new_ses.title, "Sprint Planning");

        // 3. Save and retrieve messages
        let user_msg = Message {
            id: "".into(),
            session_id: new_ses.id.clone(),
            role: "user".into(),
            content: "Please plan task 1".into(),
            thought: None,
            token_usage_json: None,
            created_at: 0,
        };
        let saved_user_msg = db.save_message(&user_msg).expect("save message failed");
        assert!(!saved_user_msg.id.is_empty());

        let asst_msg = Message {
            id: "".into(),
            session_id: new_ses.id.clone(),
            role: "assistant".into(),
            content: "Task 1 breakdown: ...".into(),
            thought: Some("Thinking through task steps...".into()),
            token_usage_json: Some(r#"{"totalTokens":42}"#.into()),
            created_at: 0,
        };
        let _saved_asst_msg = db.save_message(&asst_msg).expect("save assistant message failed");

        let loaded_msgs = db.get_messages(&new_ses.id).expect("get messages failed");
        assert_eq!(loaded_msgs.len(), 2);
        assert_eq!(loaded_msgs[0].content, "Please plan task 1");
        assert_eq!(loaded_msgs[1].thought.as_deref(), Some("Thinking through task steps..."));

        // 4. Update session title
        db.update_session_title(&new_ses.id, "Updated Sprint Title")
            .expect("update session title failed");
        let updated_sessions = db.get_sessions(&new_ws.id).expect("get sessions failed");
        assert_eq!(updated_sessions[0].title, "Updated Sprint Title");

        // 5. Tool Audit Log
        let audit = ToolAuditEntry {
            id: "".into(),
            session_id: new_ses.id.clone(),
            tool_name: "terminal".into(),
            command_payload: "npm test".into(),
            hitl_status: "authorized".into(),
            exit_code: Some(0),
            executed_at: 0,
        };
        db.log_tool_execution(&audit).expect("log tool execution failed");
        let logs = db.get_tool_audit_logs(&new_ses.id).expect("get audit logs failed");
        assert_eq!(logs.len(), 1);
        assert_eq!(logs[0].tool_name, "terminal");

        // 6. Test Cascade Deletion: Deleting Workspace deletes Sessions & Messages
        db.delete_workspace(&new_ws.id).expect("delete workspace failed");
        let after_ws_sessions = db.get_sessions(&new_ws.id).expect("get sessions failed");
        assert_eq!(after_ws_sessions.len(), 0);
        let after_ws_msgs = db.get_messages(&new_ses.id).expect("get messages failed");
        assert_eq!(after_ws_msgs.len(), 0);
    }
}
