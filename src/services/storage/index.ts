import type { StorageAdapter } from "./types";
import { TauriStorageAdapter } from "./TauriStorageAdapter";
import { WebStorageAdapter } from "./WebStorageAdapter";

export * from "./types";
export * from "./TauriStorageAdapter";
export * from "./WebStorageAdapter";

export function isTauriEnvironment(): boolean {
  if (typeof window === "undefined") return false;
  return "__TAURI_INTERNALS__" in window || "__TAURI__" in window;
}

let activeAdapter: StorageAdapter | null = null;

export function getStorageAdapter(): StorageAdapter {
  if (!activeAdapter) {
    if (isTauriEnvironment()) {
      activeAdapter = new TauriStorageAdapter();
    } else {
      activeAdapter = new WebStorageAdapter();
    }
  }
  return activeAdapter;
}
