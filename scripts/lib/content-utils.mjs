import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

export function walkFiles(root, extensions) {
  if (!fs.existsSync(root)) return [];
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(target, extensions));
    else if (!extensions || extensions.some((extension) => entry.name.toLowerCase().endsWith(extension))) files.push(target);
  }
  return files;
}

export function displayPath(file) {
  return path.relative(process.cwd(), file).replaceAll("\\", "/");
}

export function loadYaml(file) {
  const raw = fs.readFileSync(file, "utf8");
  try {
    return { raw, data: yaml.load(raw) ?? {}, file };
  } catch (error) {
    const line = Number(error?.mark?.line ?? 0) + 1;
    throw new Error(`${displayPath(file)} 第 ${line} 行 YAML 格式错误，请检查缩进、冒号和引号`);
  }
}

export function itemsOf(document, fallbackKeys = []) {
  if (Array.isArray(document.data)) return document.data;
  if (Array.isArray(document.data?.items)) return document.data.items;
  for (const key of fallbackKeys) if (Array.isArray(document.data?.[key])) return document.data[key];
  return [];
}

export function lineOf(document, id) {
  if (!id) return 1;
  const lines = document.raw.split(/\r?\n/);
  const index = lines.findIndex((line) => line.includes(String(id)));
  return index < 0 ? 1 : index + 1;
}

export function printFailure(title, errors) {
  console.error(`\n❌ ${title}（${errors.length} 项）`);
  for (const error of errors) console.error(`- ${error}`);
}
