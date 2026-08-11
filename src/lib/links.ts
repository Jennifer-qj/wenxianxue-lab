export function normalizeInternalHref(href: string, currentRoute = "/", base = "/wenxianxue-lab/"): string | null {
  if (!href || href.startsWith("#") || /^(https?:|mailto:|tel:|javascript:)/.test(href)) return null;
  const url = new URL(href, `https://example.test${currentRoute}`);
  let pathname = decodeURI(url.pathname);
  if (pathname.startsWith(base)) pathname = `/${pathname.slice(base.length)}`;
  if (!pathname.endsWith("/") && !/\.[a-z0-9]+$/i.test(pathname)) pathname += "/";
  return pathname.replace(/\/+/g, "/");
}

export function joinBase(base: string, target: string): string {
  return `${base.replace(/\/$/, "")}/${target.replace(/^\//, "")}`;
}
