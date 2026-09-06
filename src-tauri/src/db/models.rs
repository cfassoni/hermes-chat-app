use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Workspace {
    pub id: String,
    pub name: String,
    pub custom_system_prompt: Option<String>,
    pub scoped_cwd: Option<String>,
    pub default_profile_id: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Session {
    pub id: String,
    pub workspace_id: String,
    pub title: String,
    pub model: String,
    pub pinned: bool,
    pub system_prompt: Option<String>,
    pub temperature: Option<f64>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Message {
    pub id: String,
    pub session_id: String,
    pub role: String,
    pub content: String,
    pub thought: Option<String>,
    pub token_usage_json: Option<String>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Attachment {
    pub id: String,
    pub message_id: Option<String>,
    pub file_name: String,
    pub file_type: String,
    pub file_size: i64,
    pub local_stored_path: String,
    pub mime_type: String,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionProfile {
    pub id: String,
    pub name: String,
    pub base_url: String,
    pub api_key_secure_ref: Option<String>,
    pub model_name: String,
    pub params_json: Option<String>,
    pub limits_json: Option<String>,
    pub is_default: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ToolAuditEntry {
    pub id: String,
    pub session_id: String,
    pub tool_name: String,
    pub command_payload: String,
    pub hitl_status: String,
    pub exit_code: Option<i32>,
    pub executed_at: i64,
}
