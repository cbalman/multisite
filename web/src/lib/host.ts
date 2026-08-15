/** Resolve tenant slug from hostname (maria.localhost → maria). */
export function getSubdomain(): string | null {
  const host = window.location.hostname.toLowerCase();

  if (host === "localhost" || host === "127.0.0.1" || host === "www.localhost") {
    return null;
  }

  const parts = host.split(".");

  // maria.localhost
  if (parts.length === 2 && parts[1] === "localhost") {
    const slug = parts[0];
    if (["www", "api", "app", "admin"].includes(slug)) return null;
    return slug;
  }

  // maria.example.com
  if (parts.length >= 3) {
    const slug = parts[0];
    if (["www", "api", "app", "admin"].includes(slug)) return null;
    return slug;
  }

  return null;
}

export function sitePublicUrl(slug: string): string {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : "";

  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return `${protocol}//${slug}.localhost${port}`;
  }

  const base = hostname.replace(/^www\./, "");
  return `${protocol}//${slug}.${base}${port}`;
}
