export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;

export type StorageWriteResult =
  | { ok: true }
  | { ok: false; reason: "unavailable" | "quota" | "write_failed" };

export function browserStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function readLocalJson<T>(key: string, fallback: T, storage = browserStorage()): T {
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeLocalJson(key: string, value: unknown, storage = browserStorage()): StorageWriteResult {
  if (!storage) return { ok: false, reason: "unavailable" };
  try {
    storage.setItem(key, JSON.stringify(value));
    return { ok: true };
  } catch (error) {
    const name = error instanceof DOMException ? error.name : "";
    return { ok: false, reason: name === "QuotaExceededError" ? "quota" : "write_failed" };
  }
}

export function removeLocalValue(key: string, storage = browserStorage()): StorageWriteResult {
  if (!storage) return { ok: false, reason: "unavailable" };
  try {
    storage.removeItem(key);
    return { ok: true };
  } catch {
    return { ok: false, reason: "write_failed" };
  }
}

export function updateLocalRecord<T>(
  key: string,
  update: (current: Record<string, T>) => Record<string, T> | void,
  storage = browserStorage(),
): StorageWriteResult {
  const current = readLocalJson<unknown>(key, {}, storage);
  const record = isPlainRecord(current) ? current as Record<string, T> : {};
  const next = update(record) ?? record;
  return writeLocalJson(key, next, storage);
}

export function dispatchLocalUpdate(name = "wxlab-progress-updated") {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(name));
}

