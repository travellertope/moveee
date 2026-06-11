export interface OgData {
  title: string;
  description: string;
  image: string;
}

/** Returns true if the hostname resolves to a private/loopback/link-local IP range. */
async function isPrivateHost(hostname: string): Promise<boolean> {
  // Block raw IPs that are private without DNS lookup.
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const m = hostname.match(ipv4);
  if (m) {
    const [, a, b] = m.map(Number);
    if (
      a === 10 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a === 127 ||
      a === 0 ||
      a === 169 // 169.254.x.x link-local
    ) {
      return true;
    }
  }
  // Block localhost variants and common internal hostnames.
  const lower = hostname.toLowerCase();
  if (
    lower === "localhost" ||
    lower.endsWith(".local") ||
    lower.endsWith(".internal") ||
    lower === "metadata.google.internal" ||
    lower === "169.254.169.254"
  ) {
    return true;
  }
  return false;
}

/** Scrape Open Graph / Twitter card meta tags from a URL server-side. */
export async function scrapeOgTags(url: string): Promise<OgData> {
  const empty: OgData = { title: "", description: "", image: "" };
  if (!url) return empty;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return empty;
  }

  // Only allow http/https — block file://, ftp://, etc.
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return empty;

  // Block private/internal IP ranges and loopback.
  if (await isPrivateHost(parsed.hostname)) return empty;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Moveee/1.0; +https://themoveee.com)",
        Accept: "text/html",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!res.ok) return empty;

    // Only read the first 50 KB — enough to get <head> tags.
    const reader = res.body?.getReader();
    if (!reader) return empty;

    let html = "";
    let bytes = 0;
    while (bytes < 51200) {
      const { done, value } = await reader.read();
      if (done) break;
      html += new TextDecoder().decode(value);
      bytes += value.length;
      if (html.includes("</head>")) break;
    }
    reader.cancel().catch(() => {});

    const get = (prop: string): string => {
      const re = new RegExp(
        `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,
        "i"
      );
      const re2 = new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`,
        "i"
      );
      return (html.match(re) ?? html.match(re2))?.[1]?.trim() ?? "";
    };

    const title =
      get("og:title") || get("twitter:title") || (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? "");
    const description =
      get("og:description") || get("twitter:description") || get("description");
    const image = get("og:image") || get("twitter:image");

    return { title, description, image };
  } catch {
    return empty;
  }
}
