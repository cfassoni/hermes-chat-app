import { describe, it, expect, beforeEach } from "vitest";
import { WebStorageAdapter } from "../services/storage/WebStorageAdapter";
import type { Message, ToolAuditEntry } from "../services/storage/types";



describe("WebStorageAdapter", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should seed default workspace, session, message, and profile when empty", async () => {
    const storage = new WebStorageAdapter();

    const workspaces = await storage.getWorkspaces();
    expect(workspaces).toHaveLength(1);
    expect(workspaces[0].name).toBe("General Workspace");

    const sessions = await storage.getSessions(workspaces[0].id);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].title).toBe("Welcome to Hermes");

    const messages = await storage.getMessages(sessions[0].id);
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe("assistant");
    expect(messages[0].thought).toBeDefined();

    const profiles = await storage.getConnectionProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].isDefault).toBe(true);
  });

  it("should perform full CRUD operations on workspaces and cascade delete", async () => {
    const storage = new WebStorageAdapter();

    // Create workspace
    const newWs = await storage.createWorkspace("Engineering Core");
    expect(newWs.name).toBe("Engineering Core");

    let workspaces = await storage.getWorkspaces();
    expect(workspaces).toHaveLength(2);

    // Create session in that workspace
    const newSession = await storage.createSession(newWs.id, "Sprint 42");
    expect(newSession.title).toBe("Sprint 42");

    // Add message
    const msg: Message = {
      id: "msg-1",
      sessionId: newSession.id,
      role: "user",
      content: "Can you analyze this repo?",
      createdAt: Date.now(),
    };
    await storage.saveMessage(msg);

    let messages = await storage.getMessages(newSession.id);
    expect(messages).toHaveLength(1);

    // Delete workspace and verify cascade deletion of sessions and messages
    await storage.deleteWorkspace(newWs.id);

    workspaces = await storage.getWorkspaces();
    expect(workspaces.find((w) => w.id === newWs.id)).toBeUndefined();

    const sessions = await storage.getSessions(newWs.id);
    expect(sessions).toHaveLength(0);

    messages = await storage.getMessages(newSession.id);
    expect(messages).toHaveLength(0);
  });

  it("should update session titles and track message updates", async () => {
    const storage = new WebStorageAdapter();
    const workspaces = await storage.getWorkspaces();
    const session = await storage.createSession(workspaces[0].id, "Initial Title");

    await storage.updateSessionTitle(session.id, "Renamed Session");
    const sessions = await storage.getSessions(workspaces[0].id);
    const updated = sessions.find((s) => s.id === session.id);
    expect(updated?.title).toBe("Renamed Session");

    const message: Message = {
      id: "msg-updatable",
      sessionId: session.id,
      role: "assistant",
      content: "Draft response...",
      createdAt: Date.now(),
    };
    await storage.saveMessage(message);

    // Update message content
    message.content = "Completed response!";
    message.thought = "Resolved in 2 steps.";
    await storage.saveMessage(message);

    const messages = await storage.getMessages(session.id);
    expect(messages).toHaveLength(1);
    expect(messages[0].content).toBe("Completed response!");
    expect(messages[0].thought).toBe("Resolved in 2 steps.");
  });

  it("should log and retrieve tool execution audit entries", async () => {
    const storage = new WebStorageAdapter();
    const workspaces = await storage.getWorkspaces();
    const session = await storage.createSession(workspaces[0].id, "Tool Test Session");

    const auditEntry: ToolAuditEntry = {
      id: "audit-1",
      sessionId: session.id,
      toolName: "terminal",
      commandPayload: "git status",
      hitlStatus: "authorized",
      exitCode: 0,
      executedAt: Date.now(),
    };

    await storage.logToolExecution(auditEntry);
    const logs = await storage.getToolAuditLogs(session.id);
    expect(logs).toHaveLength(1);
    expect(logs[0].toolName).toBe("terminal");
    expect(logs[0].hitlStatus).toBe("authorized");
  });
});
