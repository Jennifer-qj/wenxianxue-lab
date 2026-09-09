import { dispatchLocalUpdate, isPlainRecord, readLocalJson, updateLocalRecord } from "./localData";

export const PROGRESS_KEY = "wxlab-progress";
export const WRONGBOOK_KEY = "wxlab-wrongbook";

export type ProgressEntry = {
  completed: boolean;
  score: number;
  total: number;
  updatedAt: string;
  title?: string;
  note?: string;
};

export function readProgressRecord(): Record<string, ProgressEntry> {
  const value = readLocalJson<unknown>(PROGRESS_KEY, {});
  return isPlainRecord(value) ? value as Record<string, ProgressEntry> : {};
}

export function saveProgressEntry(id: string, entry: Omit<ProgressEntry, "updatedAt"> & { updatedAt?: string }): boolean {
  const result = updateLocalRecord<ProgressEntry>(PROGRESS_KEY, (record) => {
    record[id] = { ...entry, updatedAt: entry.updatedAt ?? new Date().toISOString() };
  });
  if (result.ok) dispatchLocalUpdate();
  return result.ok;
}

export function removeProgressEntry(id: string): boolean {
  const result = updateLocalRecord<ProgressEntry>(PROGRESS_KEY, (record) => { delete record[id]; });
  if (result.ok) dispatchLocalUpdate();
  return result.ok;
}
