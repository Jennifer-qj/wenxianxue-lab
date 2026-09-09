import { isPlainRecord, readLocalJson, writeLocalJson } from "./localData";

export const LIBRARY_KEY = "wxlab-library-v1";

export type LibraryPageType = "chapter" | "concept" | "lab" | "path" | "guide" | "other";

export type LibraryEntry = {
  url: string;
  title: string;
  type: LibraryPageType;
  updatedAt: string;
};

export type NoteEntry = LibraryEntry & { text: string };

export type LearningLibrary = {
  version: 1;
  bookmarks: Record<string, LibraryEntry>;
  notes: Record<string, NoteEntry>;
  recent: LibraryEntry[];
};

export const emptyLibrary = (): LearningLibrary => ({ version: 1, bookmarks: {}, notes: {}, recent: [] });

export function readLibrary(): LearningLibrary {
  if (typeof window === "undefined") return emptyLibrary();
  const parsed = readLocalJson<unknown>(LIBRARY_KEY, {});
  if (!isPlainRecord(parsed)) return emptyLibrary();
  return {
    version: 1,
    bookmarks: isPlainRecord(parsed.bookmarks) ? parsed.bookmarks as LearningLibrary["bookmarks"] : {},
    notes: isPlainRecord(parsed.notes) ? parsed.notes as LearningLibrary["notes"] : {},
    recent: Array.isArray(parsed.recent) ? parsed.recent.filter(isPlainRecord).slice(0, 30) as LearningLibrary["recent"] : [],
  };
}

export function writeLibrary(library: LearningLibrary): boolean {
  const result = writeLocalJson(LIBRARY_KEY, { ...library, version: 1 });
  if (result.ok) window.dispatchEvent(new CustomEvent("wxlab-library-updated"));
  return result.ok;
}

export function recordRecent(entry: Omit<LibraryEntry, "updatedAt">) {
  const library = readLibrary();
  const updated = { ...entry, updatedAt: new Date().toISOString() };
  library.recent = [updated, ...library.recent.filter((item) => item.url !== entry.url)].slice(0, 30);
  writeLibrary(library);
}

export const libraryTypeNames: Record<LibraryPageType, string> = {
  chapter: "章节",
  concept: "概念",
  lab: "实验",
  path: "路径",
  guide: "指南",
  other: "页面",
};
