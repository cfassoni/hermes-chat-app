import type { Workspace, Session, Message } from "../../types";
import type { StorageAdapter, ConnectionProfile, ToolAuditEntry } from "./types";

const WORKSPACES_KEY = "hermes_workspaces";
const SESSIONS_KEY = "hermes_sessions";
const MESSAGES_KEY = "hermes_messages";
const PROFILES_KEY = "hermes_profiles";
const AUDIT_LOGS_KEY = "hermes_audit_logs";

export class WebStorageAdapter implements StorageAdapter {
  constructor() {
    this.seedDefaultsIfEmpty();
  }

  private seedDefaultsIfEmpty(): void {
    const workspaces = this.getItem<Workspace[]>(WORKSPACES_KEY, []);
    if (workspaces.length === 0) {
      const now = Date.now();
      const defaultWorkspace: Workspace = {
        id: "ws-default",
        name: "General Workspace",
        createdAt: now,
        updatedAt: now,
      };
      this.setItem(WORKSPACES_KEY, [defaultWorkspace]);

      const defaultSession: Session = {
        id: "session-default",
        workspaceId: defaultWorkspace.id,
        title: "Welcome to Hermes",
        model: "hermes-3-llama-3.1-8b",
        createdAt: now,
        updatedAt: now,
      };
      this.setItem(SESSIONS_KEY, [defaultSession]);

      const defaultMessage: Message = {
        id: "msg-welcome",
        sessionId: defaultSession.id,
        role: "assistant",
        content: "Hello! I am **Hermes**, your autonomous AI engineering assistant. How can I assist you today?",
        thought: "System initialized in local mode. Ready for user instructions.",
        createdAt: now,
      };
      this.setItem(MESSAGES_KEY, [defaultMessage]);

      const defaultProfile: ConnectionProfile = {
        id: "profile-default",
        name: "Local Hermes Node",
        baseUrl: "http://127.0.0.1:8080/v1",
        modelName: "hermes-3-llama-3.1-8b",
        isDefault: true,
      };
      this.setItem(PROFILES_KEY, [defaultProfile]);
    }
  }

  private getItem<T>(key: string, fallback: T): T {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return fallback;
      }
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (e) {
      console.error(`Failed to write key ${key} to localStorage:`, e);
    }
  }

  async getWorkspaces(): Promise<Workspace[]> {
    return this.getItem<Workspace[]>(WORKSPACES_KEY, []);
  }

  async createWorkspace(name: string, scopedCwd?: string, customPrompt?: string): Promise<Workspace> {
    const workspaces = await this.getWorkspaces();
    const now = Date.now();
    const newWs: Workspace = {
      id: `ws-${now}-${Math.random().toString(36).substring(2, 7)}`,
      name,
      scopedCwd,
      customSystemPrompt: customPrompt,
      createdAt: now,
      updatedAt: now,
    };

    workspaces.push(newWs);
    this.setItem(WORKSPACES_KEY, workspaces);
    return newWs;
  }

  async deleteWorkspace(id: string): Promise<void> {
    const workspaces = (await this.getWorkspaces()).filter((w) => w.id !== id);
    this.setItem(WORKSPACES_KEY, workspaces);

    // Cascade delete sessions and messages
    const sessions = (await this.getItem<Session[]>(SESSIONS_KEY, [])).filter(
      (s) => s.workspaceId === id
    );
    for (const session of sessions) {
      await this.deleteSession(session.id);
    }
  }

  async getSessions(workspaceId: string): Promise<Session[]> {
    const sessions = this.getItem<Session[]>(SESSIONS_KEY, []);
    return sessions
      .filter((s) => s.workspaceId === workspaceId)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async createSession(workspaceId: string, title = "New Chat", model = "hermes-3-llama-3.1-8b"): Promise<Session> {
    const sessions = this.getItem<Session[]>(SESSIONS_KEY, []);
    const now = Date.now();
    const newSession: Session = {
      id: `ses-${now}-${Math.random().toString(36).substring(2, 7)}`,
      workspaceId,
      title,
      model,
      createdAt: now,
      updatedAt: now,
    };
    sessions.unshift(newSession);
    this.setItem(SESSIONS_KEY, sessions);
    return newSession;
  }

  async updateSessionTitle(id: string, title: string): Promise<void> {
    const sessions = this.getItem<Session[]>(SESSIONS_KEY, []);
    const index = sessions.findIndex((s) => s.id === id);
    if (index !== -1) {
      sessions[index] = { ...sessions[index], title, updatedAt: Date.now() };
      this.setItem(SESSIONS_KEY, sessions);
    }
  }

  async deleteSession(id: string): Promise<void> {
    const sessions = this.getItem<Session[]>(SESSIONS_KEY, []).filter((s) => s.id !== id);
    this.setItem(SESSIONS_KEY, sessions);

    // Cascade delete messages
    const messages = this.getItem<Message[]>(MESSAGES_KEY, []).filter((m) => m.sessionId !== id);
    this.setItem(MESSAGES_KEY, messages);
  }

  async getMessages(sessionId: string): Promise<Message[]> {
    const messages = this.getItem<Message[]>(MESSAGES_KEY, []);
    return messages
      .filter((m) => m.sessionId === sessionId)
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  async saveMessage(message: Message): Promise<Message> {
    const messages = this.getItem<Message[]>(MESSAGES_KEY, []);
    const existingIndex = messages.findIndex((m) => m.id === message.id);
    if (existingIndex !== -1) {
      messages[existingIndex] = message;
    } else {
      messages.push(message);
    }
    this.setItem(MESSAGES_KEY, messages);

    // Touch session updatedAt
    const sessions = this.getItem<Session[]>(SESSIONS_KEY, []);
    const sIndex = sessions.findIndex((s) => s.id === message.sessionId);
    if (sIndex !== -1) {
      sessions[sIndex].updatedAt = message.createdAt || Date.now();
      this.setItem(SESSIONS_KEY, sessions);
    }

    return message;
  }

  async deleteMessage(id: string): Promise<void> {
    const messages = this.getItem<Message[]>(MESSAGES_KEY, []).filter((m) => m.id !== id);
    this.setItem(MESSAGES_KEY, messages);
  }

  async getConnectionProfiles(): Promise<ConnectionProfile[]> {
    return this.getItem<ConnectionProfile[]>(PROFILES_KEY, []);
  }

  async saveConnectionProfile(profile: ConnectionProfile): Promise<ConnectionProfile> {
    const profiles = this.getItem<ConnectionProfile[]>(PROFILES_KEY, []);
    const idx = profiles.findIndex((p) => p.id === profile.id);
    if (idx !== -1) {
      profiles[idx] = profile;
    } else {
      profiles.push(profile);
    }
    this.setItem(PROFILES_KEY, profiles);
    return profile;
  }

  async logToolExecution(entry: ToolAuditEntry): Promise<void> {
    const logs = this.getItem<ToolAuditEntry[]>(AUDIT_LOGS_KEY, []);
    logs.push(entry);
    this.setItem(AUDIT_LOGS_KEY, logs);
  }

  async getToolAuditLogs(sessionId: string): Promise<ToolAuditEntry[]> {
    const logs = this.getItem<ToolAuditEntry[]>(AUDIT_LOGS_KEY, []);
    return logs.filter((l) => l.sessionId === sessionId).sort((a, b) => a.executedAt - b.executedAt);
  }
}
