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

export function platformOrigin(): string {
  const protocol = window.location.protocol;
  const port = window.location.port ? `:${window.location.port}` : "";
  const host = window.location.hostname.toLowerCase();

  if (host === "localhost" || host.endsWith(".localhost")) {
    return `${protocol}//localhost${port}`;
  }

  const parts = host.split(".");
  if (parts.length >= 3) {
    return `${protocol}//${parts.slice(1).join(".")}${port}`;
  }
  return `${protocol}//${host}${port}`;
}

export function sitePublicUrl(slug: string): string {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : "";

  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return `${protocol}//${slug}.localhost${port}`;
  }

  const base = hostname.replace(/^www\./, "");
  const root = base.split(".").length >= 2 ? base.split(".").slice(-2).join(".") : base;
  // If already on subdomain, rebuild from root domain
  const parts = hostname.replace(/^www\./, "").split(".");
  const domain = parts.length >= 3 ? parts.slice(1).join(".") : parts.join(".");
  return `${protocol}//${slug}.${domain}${port}`;
}

export function sitePanelUrl(slug: string): string {
  return `${sitePublicUrl(slug)}/panel`;
}
