export function normalizeInternalHref(href, currentRoute = "/", base = "/wenxianxue-lab/") {
  if (!href || href.startsWith("#") || /^(https?:|mailto:|tel:|javascript:)/.test(href)) return null;
  const url = new URL(href, `https://example.test${currentRoute}`);
  let pathname = decodeURI(url.pathname);
  if (pathname.startsWith(base)) pathname = `/${pathname.slice(base.length)}`;
  if (!pathname.endsWith("/") && !/\.[a-z0-9]+$/i.test(pathname)) pathname += "/";
  return pathname.replace(/\/+/g, "/");
}

export function joinBase(base, target) {
  return `${base.replace(/\/$/, "")}/${target.replace(/^\//, "")}`;
}
