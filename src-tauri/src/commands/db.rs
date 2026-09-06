use crate::db::models::*;
use crate::db::Database;
use tauri::State;

#[tauri::command]
pub fn db_get_workspaces(db: State<'_, Database>) -> Result<Vec<Workspace>, String> {
    db.get_workspaces()
}

#[tauri::command]
pub fn db_create_workspace(
    db: State<'_, Database>,
    name: String,
    scoped_cwd: Option<String>,
    custom_prompt: Option<String>,
) -> Result<Workspace, String> {
    db.create_workspace(&name, scoped_cwd.as_deref(), custom_prompt.as_deref())
}

#[tauri::command]
pub fn db_delete_workspace(db: State<'_, Database>, id: String) -> Result<(), String> {
    db.delete_workspace(&id)
}

#[tauri::command]
pub fn db_get_sessions(
    db: State<'_, Database>,
    workspace_id: String,
) -> Result<Vec<Session>, String> {
    db.get_sessions(&workspace_id)
}

#[tauri::command]
pub fn db_create_session(
    db: State<'_, Database>,
    workspace_id: String,
    title: String,
    model: String,
) -> Result<Session, String> {
    db.create_session(&workspace_id, &title, &model)
}

#[tauri::command]
pub fn db_update_session_title(
    db: State<'_, Database>,
    id: String,
    title: String,
) -> Result<(), String> {
    db.update_session_title(&id, &title)
}

#[tauri::command]
pub fn db_delete_session(db: State<'_, Database>, id: String) -> Result<(), String> {
    db.delete_session(&id)
}

#[tauri::command]
pub fn db_get_messages(
    db: State<'_, Database>,
    session_id: String,
) -> Result<Vec<Message>, String> {
    db.get_messages(&session_id)
}

#[tauri::command]
pub fn db_save_message(db: State<'_, Database>, message: Message) -> Result<Message, String> {
    db.save_message(&message)
}

#[tauri::command]
pub fn db_delete_message(db: State<'_, Database>, id: String) -> Result<(), String> {
    db.delete_message(&id)
}

#[tauri::command]
pub fn db_get_connection_profiles(
    db: State<'_, Database>,
) -> Result<Vec<ConnectionProfile>, String> {
    db.get_connection_profiles()
}

#[tauri::command]
pub fn db_save_connection_profile(
    db: State<'_, Database>,
    profile: ConnectionProfile,
) -> Result<ConnectionProfile, String> {
    db.save_connection_profile(&profile)
}

#[tauri::command]
pub fn db_log_tool_execution(
    db: State<'_, Database>,
    entry: ToolAuditEntry,
) -> Result<(), String> {
    db.log_tool_execution(&entry)
}

#[tauri::command]
pub fn db_get_tool_audit_logs(
    db: State<'_, Database>,
    session_id: String,
) -> Result<Vec<ToolAuditEntry>, String> {
    db.get_tool_audit_logs(&session_id)
}
