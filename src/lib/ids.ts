const formats = {
  concept: /^(c|m|w|p|ev|me)_[a-z0-9_]+$/,
  mku: /^mku-\d{2}-\d{2}-\d{2}$/,
  quiz: /^q-ch\d{2}-\d{3}$/,
  lab: /^lab-\d{2}-case-\d{3}$/,
  edge: /^e-\d{4}$/,
} as const;

export type IdFormat = keyof typeof formats;

export function assertId(format: IdFormat, value: string): string {
  if (!formats[format].test(value)) throw new Error(`ID“${value}”不符合 ${format} 命名规范`);
  return value;
}

export function assertUniqueIds(items: { id: string }[], label = "对象"): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) throw new Error(`${label} ID 重复：${item.id}`);
    seen.add(item.id);
  }
}
