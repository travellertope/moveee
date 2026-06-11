export interface OgData {
  title: string;
  description: string;
  image: string;
}

/** Scrape Open Graph / Twitter card meta tags from a URL server-side. */
export async function scrapeOgTags(url: string): Promise<OgData> {
  const empty: OgData = { title: "", description: "", image: "" };
  if (!url) return empty;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
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
