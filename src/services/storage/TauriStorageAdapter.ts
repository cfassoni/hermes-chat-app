import { invoke } from "@tauri-apps/api/core";
import type { Workspace, Session, Message } from "../../types";
import type { StorageAdapter, ConnectionProfile, ToolAuditEntry } from "./types";

export class TauriStorageAdapter implements StorageAdapter {
  async getWorkspaces(): Promise<Workspace[]> {
    return invoke<Workspace[]>("db_get_workspaces");
  }

  async createWorkspace(name: string, scopedCwd?: string, customPrompt?: string): Promise<Workspace> {
    return invoke<Workspace>("db_create_workspace", {
      name,
      scopedCwd: scopedCwd || null,
      customPrompt: customPrompt || null,
    });
  }

  async deleteWorkspace(id: string): Promise<void> {
    return invoke<void>("db_delete_workspace", { id });
  }

  async getSessions(workspaceId: string): Promise<Session[]> {
    return invoke<Session[]>("db_get_sessions", { workspaceId });
  }

  async createSession(workspaceId: string, title?: string, model?: string): Promise<Session> {
    return invoke<Session>("db_create_session", {
      workspaceId,
      title: title || "New Chat",
      model: model || "hermes-3-llama-3.1-8b",
    });
  }

  async updateSessionTitle(id: string, title: string): Promise<void> {
    return invoke<void>("db_update_session_title", { id, title });
  }

  async deleteSession(id: string): Promise<void> {
    return invoke<void>("db_delete_session", { id });
  }

  async getMessages(sessionId: string): Promise<Message[]> {
    return invoke<Message[]>("db_get_messages", { sessionId });
  }

  async saveMessage(message: Message): Promise<Message> {
    return invoke<Message>("db_save_message", { message });
  }

  async deleteMessage(id: string): Promise<void> {
    return invoke<void>("db_delete_message", { id });
  }

  async getConnectionProfiles(): Promise<ConnectionProfile[]> {
    return invoke<ConnectionProfile[]>("db_get_connection_profiles");
  }

  async saveConnectionProfile(profile: ConnectionProfile): Promise<ConnectionProfile> {
    return invoke<ConnectionProfile>("db_save_connection_profile", { profile });
  }

  async logToolExecution(entry: ToolAuditEntry): Promise<void> {
    return invoke<void>("db_log_tool_execution", { entry });
  }

  async getToolAuditLogs(sessionId: string): Promise<ToolAuditEntry[]> {
    return invoke<ToolAuditEntry[]>("db_get_tool_audit_logs", { sessionId });
  }
}
