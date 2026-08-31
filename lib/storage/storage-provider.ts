/**
 * StorageProvider abstraction — TRD §6.1
 * V1: LocalStorageProvider
 * Never import localStorage directly elsewhere.
 */

export interface StorageProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  listKeys(prefix: string): Promise<string[]>;
  transaction<T>(keys: string[], fn: (snapshot: Record<string, unknown>) => Record<string, unknown>): Promise<T>;
}

// Sync variant for convenience where async not needed (used internally)
export interface SyncStorageProvider {
  getSync<T>(key: string): T | null;
  setSync<T>(key: string, value: T): void;
}

export class LocalStorageProvider implements StorageProvider {
  async get<T>(key: string): Promise<T | null> {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch {
      // Mark corrupted but don't crash whole app — caller handles null
      console.warn(`[Storage] corrupted key: ${key}`);
      return null;
    }
  }

  getSync<T>(key: string): T | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (typeof window === "undefined") return;
    // Soft quota warning before write
    try {
      const payload = JSON.stringify(value);
      // Estimate size: rough 2 bytes per char
      const approxBytes = payload.length * 2;
      if (approxBytes > 4 * 1024 * 1024) {
        console.warn("[Storage] large payload ~" + Math.round(approxBytes / 1024) + "KB for key " + key);
      }
      localStorage.setItem(key, payload);
    } catch (e) {
      if (e instanceof DOMException && (e.name === "QuotaExceededError" || (e as unknown as { code?: number }).code === 22)) {
        throw new Error("Storage quota exceeded. Please export your data and clear old records to free up space.");
      }
      // SecurityError in private browsing
      if (e instanceof DOMException && e.name === "SecurityError") {
        throw new Error("Storage unavailable in this browser mode. Try a normal window.");
      }
      throw e;
    }
  }

  setSync<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, JSON.stringify(value));
  }

  async remove(key: string): Promise<void> {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  }

  async listKeys(prefix: string): Promise<string[]> {
    if (typeof window === "undefined") return [];
    const out: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) out.push(k);
    }
    return out;
  }

  async transaction<T>(keys: string[], fn: (snapshot: Record<string, unknown>) => Record<string, unknown>): Promise<T> {
    // Snapshot
    const snapshot: Record<string, unknown> = {};
    for (const k of keys) {
      snapshot[k] = await this.get(k);
    }
    const originalSnapshot = { ...snapshot };
    let result: Record<string, unknown>;
    try {
      result = fn(snapshot);
    } catch (e) {
      throw e;
    }
    // Write back — least critical first, but here we just write sequentially.
    // On failure, attempt compensating rollback.
    const written: string[] = [];
    try {
      for (const k of keys) {
        if (k in result) {
          await this.set(k, result[k]);
          written.push(k);
        }
      }
    } catch (e) {
      // Rollback written keys
      for (const k of written) {
        try {
          const orig = originalSnapshot[k];
          if (orig === null || orig === undefined) await this.remove(k);
          else await this.set(k, orig);
        } catch {
          // best effort
        }
      }
      throw e;
    }
    return result as unknown as T;
  }

  // Helpers for sync consumers (stores)
  has(key: string): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(key) !== null;
  }

  clear(prefix?: string): void {
    if (typeof window === "undefined") return;
    if (!prefix) {
      localStorage.clear();
      return;
    }
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) toRemove.push(k);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  }
}

let _provider: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (!_provider) _provider = new LocalStorageProvider();
  return _provider;
}

export function getStorageSync(): LocalStorageProvider {
  if (!_provider) _provider = new LocalStorageProvider();
  return _provider as LocalStorageProvider;
}

export const CURRENT_SCHEMA_VERSION = 1;

export async function ensureSchemaVersion(): Promise<void> {
  const storage = getStorage();
  // schemaMeta stores { schemaVersion: number, lastMigratedAt: string }
  const meta = await storage.get<{ schemaVersion: number; lastMigratedAt: string }>("calexpenses:v1:schemaMeta");
  if (!meta) {
    await storage.set("calexpenses:v1:schemaMeta", { schemaVersion: CURRENT_SCHEMA_VERSION, lastMigratedAt: new Date().toISOString() });
    return;
  }
  if (meta.schemaVersion < CURRENT_SCHEMA_VERSION) {
    // future migrations
    await storage.set("calexpenses:v1:schemaMeta", { schemaVersion: CURRENT_SCHEMA_VERSION, lastMigratedAt: new Date().toISOString() });
  }
}
