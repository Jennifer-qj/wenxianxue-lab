import { emptyLibrary, type LearningLibrary } from "./learningArchive";
import { isPlainRecord, type StorageLike } from "./localData";

export const ARCHIVE_VERSION = 4;
export const MAX_ARCHIVE_BYTES = 2 * 1024 * 1024;
export const PROGRESS_KEY = "wxlab-progress";
export const WRONGBOOK_KEY = "wxlab-wrongbook";
export const JOURNEY_KEY = "wxlab-chapter-journeys-v1";
export const LIBRARY_KEY = "wxlab-library-v1";
const DEEPDIVE_PREFIX = "wenxianxue-deepdive-";
const BLOCKED_KEYS = new Set(["__proto__", "prototype", "constructor"]);

export type LearningArchivePayload = {
  version: 4;
  exportedAt: string;
  progress: Record<string, unknown>;
  wrongBook: Record<string, unknown>;
  deepdives: Record<string, unknown>;
  library: LearningLibrary;
  chapterJourneys: Record<string, unknown>;
};

function cleanRecord(value: unknown, limit = 500): Record<string, unknown> {
  if (!isPlainRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !BLOCKED_KEYS.has(key))
      .slice(0, limit),
  );
}

function cleanLibrary(value: unknown): LearningLibrary {
  if (!isPlainRecord(value)) return emptyLibrary();
  return {
    version: 1,
    bookmarks: cleanRecord(value.bookmarks, 500) as LearningLibrary["bookmarks"],
    notes: cleanRecord(value.notes, 500) as LearningLibrary["notes"],
    recent: Array.isArray(value.recent) ? value.recent.filter(isPlainRecord).slice(0, 30) as LearningLibrary["recent"] : [],
  };
}

export function parseLearningArchive(text: string): { payload: LearningArchivePayload; migratedFrom: number | null } {
  if (new TextEncoder().encode(text).byteLength > MAX_ARCHIVE_BYTES) throw new Error("archive_too_large");
  const raw = JSON.parse(text) as unknown;
  if (!isPlainRecord(raw) || ![1, 2, 3, 4].includes(Number(raw.version))) throw new Error("invalid_archive");
  if (!isPlainRecord(raw.progress) || !isPlainRecord(raw.wrongBook)) throw new Error("invalid_archive");

  const originalVersion = Number(raw.version);
  const deepdives = Object.fromEntries(
    Object.entries(cleanRecord(raw.deepdives, 100)).filter(([key]) => key.startsWith(DEEPDIVE_PREFIX)),
  );
  return {
    migratedFrom: originalVersion === ARCHIVE_VERSION ? null : originalVersion,
    payload: {
      version: ARCHIVE_VERSION,
      exportedAt: typeof raw.exportedAt === "string" ? raw.exportedAt : new Date(0).toISOString(),
      progress: cleanRecord(raw.progress),
      wrongBook: cleanRecord(raw.wrongBook),
      deepdives,
      library: originalVersion >= 2 ? cleanLibrary(raw.library) : emptyLibrary(),
      chapterJourneys: originalVersion >= 3 ? cleanRecord(raw.chapterJourneys, 100) : {},
    },
  };
}

export function applyLearningArchive(payload: LearningArchivePayload, storage: StorageLike): boolean {
  const existingDeepDiveKeys = Array.from({ length: storage.length }, (_, index) => storage.key(index))
    .filter((key): key is string => Boolean(key?.startsWith(DEEPDIVE_PREFIX)));
  const target = new Map<string, string>([
    [PROGRESS_KEY, JSON.stringify(payload.progress)],
    [WRONGBOOK_KEY, JSON.stringify(payload.wrongBook)],
    [LIBRARY_KEY, JSON.stringify(payload.library)],
    [JOURNEY_KEY, JSON.stringify(payload.chapterJourneys)],
    ...Object.entries(payload.deepdives).map(([key, value]) => [key, JSON.stringify(value)] as [string, string]),
  ]);
  const touched = new Set([...existingDeepDiveKeys, ...target.keys()]);
  const backup = new Map([...touched].map((key) => [key, storage.getItem(key)]));

  try {
    existingDeepDiveKeys.forEach((key) => storage.removeItem(key));
    target.forEach((value, key) => storage.setItem(key, value));
    return true;
  } catch {
    try {
      touched.forEach((key) => {
        const value = backup.get(key);
        if (value === null || value === undefined) storage.removeItem(key);
        else storage.setItem(key, value);
      });
    } catch { /* 浏览器拒绝存储时，尽最大可能回滚。 */ }
    return false;
  }
}

export function inspectLearningStorage(storage: StorageLike): { status: "healthy" | "empty" | "needs_attention"; bytes: number; issues: number } {
  const tracked = [PROGRESS_KEY, WRONGBOOK_KEY, LIBRARY_KEY, JOURNEY_KEY];
  const values = tracked.map((key) => storage.getItem(key)).filter((value): value is string => value !== null);
  let issues = 0;
  values.forEach((value) => { try { JSON.parse(value); } catch { issues += 1; } });
  const bytes = values.reduce((total, value) => total + new TextEncoder().encode(value).byteLength, 0);
  return { status: issues ? "needs_attention" : values.length ? "healthy" : "empty", bytes, issues };
}

