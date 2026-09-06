import React, { useState, useEffect } from "react";
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

const INITIAL_WORKSPACES: Workspace[] = [
  { id: "ws-1", name: "Default Workspace", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "ws-2", name: "Hermes Development", createdAt: Date.now(), updatedAt: Date.now() },
];

const INITIAL_SESSIONS: Session[] = [
  {
    id: "sess-1",
    workspaceId: "ws-1",
    title: "Project Scaffolding & Setup",
    model: "hermes-3-llama-3.1-8b",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "sess-2",
    workspaceId: "ws-1",
    title: "SSE Stream Protocol Design",
    model: "hermes-3-llama-3.1-8b",
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
  },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: "msg-1",
    sessionId: "sess-1",
    role: "assistant",
    content: "Welcome to **Hermes Chat App**! I am connected to Nous Research's `hermes-agent`. How can I assist your workflow today?",
    thought: "System initialized. Local-first runtime active. Waiting for user instruction.",
    createdAt: Date.now(),
  },
];

export function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string>("sess-1");
  const [inputContent, setInputContent] = useState("");
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [isRecording, setIsRecording] = useState(false);

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

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputContent.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      sessionId: activeSessionId,
      role: "user",
      content: inputContent.trim(),
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputContent("");
  };

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
            <span className="truncate">{INITIAL_WORKSPACES[0].name}</span>
          </div>
          <button
            type="button"
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title="New Session"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Recent Sessions
          </div>
          {INITIAL_SESSIONS.map((sess) => (
            <button
              key={sess.id}
              type="button"
              onClick={() => setActiveSessionId(sess.id)}
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
        </div>

        {/* Settings Footer */}
        <div className="p-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </div>
          <span className="text-zinc-500">v0.1.0</span>
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
            >
              {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
            </button>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-zinc-100 tracking-tight">Hermes Chat</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                Tauri v2
              </span>
            </div>
          </div>

          {/* Connection status pill */}
          <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-xs text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-zinc-400">hermes-3-llama-3.1-8b</span>
          </div>
        </header>

        {/* Messages Viewport */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((msg) => (
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
            ))}
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
                disabled={!inputContent.trim()}
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
