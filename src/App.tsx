import React, { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Plus,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Paperclip,
  Mic,
  Send,
  Sparkles,
  Bot,
  User,
  ChevronDown,
  Terminal,
} from "lucide-react";

import type { Message, Session, Workspace } from "./types";
import { getStorageAdapter } from "./services/storage";

export function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputContent, setInputContent] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);

  // Load workspaces on mount
  useEffect(() => {
    let isMounted = true;
    const initDatabase = async () => {
      try {
        const storage = getStorageAdapter();
        const wsList = await storage.getWorkspaces();
        if (!isMounted) return;

        setWorkspaces(wsList);
        if (wsList.length > 0) {
          const initialWs = wsList[0];
          setActiveWorkspaceId(initialWs.id);

          const sessList = await storage.getSessions(initialWs.id);
          if (!isMounted) return;
          setSessions(sessList);

          if (sessList.length > 0) {
            const initialSession = sessList[0];
            setActiveSessionId(initialSession.id);
            const msgList = await storage.getMessages(initialSession.id);
            if (!isMounted) return;
            setMessages(msgList);
          }
        }
      } catch (err) {
        console.error("Failed to initialize database storage:", err);
      } finally {
        if (isMounted) setIsDbReady(true);
      }
    };

    initDatabase();
    return () => {
      isMounted = false;
    };
  }, []);

  // Switch sessions
  const handleSelectSession = useCallback(async (sessionId: string) => {
    setActiveSessionId(sessionId);
    try {
      const storage = getStorageAdapter();
      const msgList = await storage.getMessages(sessionId);
      setMessages(msgList);
    } catch (err) {
      console.error("Failed to load session messages:", err);
    }
  }, []);

  // Create new session in current workspace
  const handleCreateSession = async () => {
    if (!activeWorkspaceId) return;
    try {
      const storage = getStorageAdapter();
      const newSession = await storage.createSession(
        activeWorkspaceId,
        `Chat ${sessions.length + 1}`
      );
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setMessages([]);
    } catch (err) {
      console.error("Failed to create session:", err);
    }
  };

  // Keyboard shortcut Ctrl+B / Cmd+B for sidebar toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputContent.trim() || !activeSessionId) return;

    const content = inputContent.trim();
    setInputContent("");

    const userMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sessionId: activeSessionId,
      role: "user",
      content,
      createdAt: Date.now(),
    };

    // Optimistically append message
    setMessages((prev) => [...prev, userMessage]);

    try {
      const storage = getStorageAdapter();
      await storage.saveMessage(userMessage);
    } catch (err) {
      console.error("Failed to persist user message:", err);
    }
  };

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const currentSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 antialiased font-sans">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-0 -translate-x-full"
        } transition-all duration-200 ease-in-out border-r border-zinc-800 bg-zinc-900/70 flex flex-col z-20 shrink-0 overflow-hidden`}
        aria-label="Sidebar"
      >
        {/* Workspace selector */}
        <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 font-medium text-sm text-zinc-200 truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span className="truncate">
              {currentWorkspace ? currentWorkspace.name : "Default Workspace"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCreateSession}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title="New Session"
            aria-label="New Session"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Recent Sessions
          </div>
          {sessions.map((sess) => (
            <button
              key={sess.id}
              type="button"
              onClick={() => handleSelectSession(sess.id)}
              className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-sm text-left transition-colors ${
                activeSessionId === sess.id
                  ? "bg-zinc-800 text-zinc-100 font-medium"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0 text-zinc-400" />
              <span className="truncate">{sess.title}</span>
            </button>
          ))}
          {sessions.length === 0 && (
            <div className="p-4 text-center text-xs text-zinc-500">
              No sessions yet. Click + to start a chat.
            </div>
          )}
        </div>

        {/* Settings Footer */}
        <div className="p-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </div>
          <span className="text-zinc-500 font-mono">SQLite v0.2.0</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-zinc-950 relative">
        {/* Top Navbar */}
        <header className="h-14 border-b border-zinc-800/80 px-4 flex items-center justify-between bg-zinc-950/80 backdrop-blur shrink-0">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="Toggle Sidebar (Ctrl+B)"
              aria-label="Toggle Sidebar"
            >
              {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
            </button>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-zinc-100 tracking-tight">Hermes Chat</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                Tauri v2
              </span>
            </div>
            {currentSession && (
              <span className="hidden md:inline text-xs text-zinc-500 border-l border-zinc-800 pl-3 truncate max-w-xs">
                {currentSession.title}
              </span>
            )}
          </div>

          {/* Connection status pill */}
          <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-xs text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-zinc-400">
              {currentSession?.model || "hermes-3-llama-3.1-8b"}
            </span>
          </div>
        </header>

        {/* Messages Viewport */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {!isDbReady ? (
              <div className="flex items-center justify-center h-64 text-sm text-zinc-500 font-mono">
                Connecting to local SQLite database...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-zinc-200">Start a new conversation</h3>
                <p className="text-xs text-zinc-400 max-w-sm">
                  Hermes Agent is ready to execute terminal commands, parse codebase tasks, and stream reasoning tokens.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 text-sm leading-relaxed ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`flex flex-col space-y-2 max-w-[85%] ${
                      msg.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    {/* Thought Accordion */}
                    {msg.thought && (
                      <details className="group border border-zinc-800 bg-zinc-900/50 rounded-lg text-xs w-full text-zinc-400 overflow-hidden">
                        <summary className="px-3 py-1.5 cursor-pointer select-none flex items-center justify-between hover:bg-zinc-800/40">
                          <div className="flex items-center space-x-1.5 font-mono text-zinc-400">
                            <Sparkles className="w-3 h-3 text-indigo-400" />
                            <span>Reasoning Process</span>
                          </div>
                          <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
                        </summary>
                        <div className="p-3 border-t border-zinc-800/50 font-mono text-zinc-400 bg-zinc-950/40 whitespace-pre-wrap">
                          {msg.thought}
                        </div>
                      </details>
                    )}

                    <div
                      className={`rounded-2xl px-4 py-2.5 ${
                        msg.role === "user"
                          ? "bg-indigo-600 text-white"
                          : "bg-zinc-900 border border-zinc-800 text-zinc-200"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>

                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Input Dock */}
        <div className="border-t border-zinc-800/80 bg-zinc-950/90 backdrop-blur p-4 shrink-0">
          <div className="max-w-4xl mx-auto">
            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 focus-within:border-indigo-500/50 transition-colors"
            >
              {/* Attachment */}
              <button
                type="button"
                className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors"
                title="Attach file (images, audio, code)"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Voice toggle */}
              <button
                type="button"
                onClick={() => setIsRecording(!isRecording)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isRecording
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                }`}
                title={isRecording ? "Stop Recording" : "Voice input"}
              >
                <Mic className="w-5 h-5" />
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                placeholder="Ask Hermes Agent or type a command..."
                className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none px-2"
              />

              {/* Local tool indicator */}
              <div
                className="hidden sm:flex items-center space-x-1 text-xs text-zinc-500 px-2 py-1 bg-zinc-950 rounded border border-zinc-800 font-mono"
                title="HITL Tool Execution Active"
              >
                <Terminal className="w-3 h-3 text-emerald-400" />
                <span>HITL</span>
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputContent.trim() || !activeSessionId}
                className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
