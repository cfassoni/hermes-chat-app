/**
 * Domain Models for Hermes Chat App
 * Conforms to Google OKF concept: documentation/architecture/data-model.md
 */

export type Role = "user" | "assistant" | "system" | "tool";

export interface Workspace {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Session {
  id: string;
  workspaceId: string;
  title: string;
  model: string;
  systemPrompt?: string;
  temperature?: number;
  createdAt: number;
  updatedAt: number;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  status: "pending_auth" | "executing" | "completed" | "rejected" | "timed_out";
  riskLevel: "low" | "medium" | "high" | "critical";
  output?: string;
  error?: string;
  executedAt?: number;
}

export interface MediaAttachment {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  localPath: string;
  base64Data?: string;
}

export interface Message {
  id: string;
  sessionId: string;
  role: Role;
  content: string;
  thought?: string;
  toolCalls?: ToolCall[];
  attachments?: MediaAttachment[];
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  createdAt: number;
}

export interface HermesConfig {
  baseUrl: string;
  apiKey?: string;
  model: string;
  temperature: number;
  maxTokens?: number;
  hitlEnabled: boolean;
  autoApproveSafeRead: boolean;
}
