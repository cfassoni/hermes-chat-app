pub mod commands;
pub mod db;

use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("failed to resolve app data dir");
            let _ = std::fs::create_dir_all(&app_data_dir);
            let db_path = app_data_dir.join("hermes.db");
            let database =
                db::Database::new(db_path).expect("failed to initialize local SQLite database");
            app.manage(database);

            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
                let _ = window.center();
            }
            Ok(())
        })


        .invoke_handler(tauri::generate_handler![
            greet,
            commands::db::db_get_workspaces,
            commands::db::db_create_workspace,
            commands::db::db_delete_workspace,
            commands::db::db_get_sessions,
            commands::db::db_create_session,
            commands::db::db_update_session_title,
            commands::db::db_delete_session,
            commands::db::db_get_messages,
            commands::db::db_save_message,
            commands::db::db_delete_message,
            commands::db::db_get_connection_profiles,
            commands::db::db_save_connection_profile,
            commands::db::db_log_tool_execution,
            commands::db::db_get_tool_audit_logs,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::greet;

    #[test]
    fn test_greet() {
        assert_eq!(greet("Hermes"), "Hello, Hermes! You've been greeted from Rust!");
    }
}
