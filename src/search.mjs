const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

function decodeDdgHref(href) {
  const m = href.match(/uddg=([^&]+)/);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return null;
  }
}

export async function searchDuckDuckGo(query) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'pt-BR,pt;q=0.9' },
  });
  if (!res.ok) {
    throw new Error(`DuckDuckGo respondeu ${res.status}`);
  }
  const html = await res.text();

  const rawLinks = [...html.matchAll(/class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)</g)].map((m) => ({
    href: m[1],
    title: m[2].trim(),
  }));

  const results = [];
  const seenDomains = new Set();
  for (const { href, title } of rawLinks) {
    const decoded = decodeDdgHref(href);
    if (!decoded) continue;

    let parsed;
    try {
      parsed = new URL(decoded);
    } catch {
      continue;
    }
    // pula links de anúncio/redirect que apontam de volta pro próprio duckduckgo/bing ads
    if (/duckduckgo\.com|bing\.com/i.test(parsed.hostname)) continue;

    if (seenDomains.has(parsed.hostname)) continue;
    seenDomains.add(parsed.hostname);

    results.push({ url: decoded, title });
  }

  return results;
}

export { USER_AGENT };
