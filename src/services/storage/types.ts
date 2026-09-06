import type { Workspace, Session, Message } from "../../types";
export type { Workspace, Session, Message };



export interface ToolAuditEntry {
  id: string;
  sessionId: string;
  toolName: string;
  commandPayload: string;
  hitlStatus: "pending_auth" | "authorized" | "denied" | "timed_out";
  exitCode?: number | null;
  executedAt: number;
}

export interface ConnectionProfile {
  id: string;
  name: string;
  baseUrl: string;
  apiKeySecureRef?: string | null;
  modelName: string;
  paramsJson?: string | null;
  limitsJson?: string | null;
  isDefault: boolean;
}

export interface StorageAdapter {
  // Workspaces
  getWorkspaces(): Promise<Workspace[]>;
  createWorkspace(name: string, scopedCwd?: string, customPrompt?: string): Promise<Workspace>;
  deleteWorkspace(id: string): Promise<void>;

  // Sessions
  getSessions(workspaceId: string): Promise<Session[]>;
  createSession(workspaceId: string, title?: string, model?: string): Promise<Session>;
  updateSessionTitle(id: string, title: string): Promise<void>;
  deleteSession(id: string): Promise<void>;

  // Messages
  getMessages(sessionId: string): Promise<Message[]>;
  saveMessage(message: Message): Promise<Message>;
  deleteMessage(id: string): Promise<void>;

  // Connection Profiles
  getConnectionProfiles(): Promise<ConnectionProfile[]>;
  saveConnectionProfile(profile: ConnectionProfile): Promise<ConnectionProfile>;

  // Tool Audit Log
  logToolExecution(entry: ToolAuditEntry): Promise<void>;
  getToolAuditLogs(sessionId: string): Promise<ToolAuditEntry[]>;
}
