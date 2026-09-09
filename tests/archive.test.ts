import { describe, expect, it } from "vitest";
import { applyLearningArchive, inspectLearningStorage, parseLearningArchive } from "../src/lib/archiveTransfer";
import { readLocalJson, updateLocalRecord, writeLocalJson, type StorageLike } from "../src/lib/localData";
import { readProgressRecord, saveProgressEntry } from "../src/lib/progressArchive";

class MemoryStorage implements StorageLike {
  data = new Map<string, string>();
  failAt = Infinity;
  writes = 0;
  get length() { return this.data.size; }
  getItem(key: string) { return this.data.get(key) ?? null; }
  key(index: number) { return [...this.data.keys()][index] ?? null; }
  removeItem(key: string) { this.data.delete(key); }
  setItem(key: string, value: string) {
    this.writes += 1;
    if (this.writes === this.failAt) throw new DOMException("full", "QuotaExceededError");
    this.data.set(key, value);
  }
}

describe("本地学习档案", () => {
  it("损坏 JSON 不会让页面崩溃", () => {
    const storage = new MemoryStorage();
    storage.data.set("broken", "{");
    expect(readLocalJson("broken", { safe: true }, storage)).toEqual({ safe: true });
    expect(inspectLearningStorage(storage).status).toBe("empty");
  });

  it("迁移旧版档案并过滤危险和无关字段", () => {
    const source = JSON.stringify({
      version: 2,
      progress: { lesson: { completed: true } },
      wrongBook: {},
      deepdives: { "wenxianxue-deepdive-ch01": { step: 1 }, unrelated: { secret: true } },
      library: { bookmarks: {}, notes: {}, recent: [] },
    });
    const result = parseLearningArchive(source);
    expect(result.migratedFrom).toBe(2);
    expect(result.payload.version).toBe(4);
    expect(result.payload.chapterJourneys).toEqual({});
    expect(result.payload.deepdives.unrelated).toBeUndefined();
  });

  it("拒绝超过 2MB 或结构错误的导入文件", () => {
    expect(() => parseLearningArchive("x".repeat(2 * 1024 * 1024 + 1))).toThrow("archive_too_large");
    expect(() => parseLearningArchive(JSON.stringify({ version: 4, progress: [], wrongBook: {} }))).toThrow("invalid_archive");
  });

  it("写入失败时回滚原有档案", () => {
    const storage = new MemoryStorage();
    storage.data.set("wxlab-progress", JSON.stringify({ old: true }));
    const { payload } = parseLearningArchive(JSON.stringify({ version: 4, progress: { next: true }, wrongBook: {} }));
    storage.failAt = 2;
    expect(applyLearningArchive(payload, storage)).toBe(false);
    expect(storage.getItem("wxlab-progress")).toBe(JSON.stringify({ old: true }));
  });

  it("统一读写和记录更新在可用存储中正常工作", () => {
    const storage = new MemoryStorage();
    expect(writeLocalJson("a", { value: 1 }, storage)).toEqual({ ok: true });
    expect(updateLocalRecord<number>("counts", (record) => { record.done = 2; }, storage)).toEqual({ ok: true });
    expect(readLocalJson("counts", {}, storage)).toEqual({ done: 2 });
  });

  it("所有互动共用容错进度层", () => {
    const source = readProgressRecord.toString() + saveProgressEntry.toString();
    expect(source).toContain("readLocalJson");
    expect(source).toContain("updateLocalRecord");
  });
});
