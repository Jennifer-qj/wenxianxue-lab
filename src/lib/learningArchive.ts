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
  try {
    const parsed = JSON.parse(localStorage.getItem(LIBRARY_KEY) || "") as Partial<LearningLibrary>;
    return {
      version: 1,
      bookmarks: parsed.bookmarks && typeof parsed.bookmarks === "object" ? parsed.bookmarks : {},
      notes: parsed.notes && typeof parsed.notes === "object" ? parsed.notes : {},
      recent: Array.isArray(parsed.recent) ? parsed.recent.slice(0, 30) : [],
    };
  } catch {
    return emptyLibrary();
  }
}

export function writeLibrary(library: LearningLibrary) {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify({ ...library, version: 1 }));
  window.dispatchEvent(new CustomEvent("wxlab-library-updated"));
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
