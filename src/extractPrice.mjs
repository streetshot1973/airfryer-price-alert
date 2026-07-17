import { USER_AGENT } from './search.mjs';
import { fetchTimeoutMs } from './config.mjs';

function extractFromJsonLd(html) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map(
    (m) => m[1]
  );

  for (const block of blocks) {
    let parsed;
    try {
      parsed = JSON.parse(block);
    } catch {
      continue;
    }
    const items = Array.isArray(parsed) ? parsed : [parsed];
    for (const item of items) {
      const candidates = item?.['@graph'] ? item['@graph'] : [item];
      for (const c of candidates) {
        const type = c?.['@type'];
        const isProduct = type === 'Product' || (Array.isArray(type) && type.includes('Product'));
        if (!isProduct || !c.offers) continue;

        const offers = Array.isArray(c.offers) ? c.offers : [c.offers];
        for (const offer of offers) {
          // pula oferta explicitamente marcada como fora de estoque/descontinuada. Se o campo
          // não vier preenchido, assume disponível (nem todo site declara isso) — não blinda
          // contra sites onde a disponibilidade real só é resolvida por JS no navegador (ex:
          // marketplace da Americanas, que declara InStock no HTML estático mesmo esgotado).
          if (offer.availability && /outofstock|discontinued|soldout/i.test(offer.availability)) continue;

          const price = offer.price ?? offer.lowPrice;
          if (price) {
            const numeric = Number(String(price).replace(',', '.'));
            if (!Number.isNaN(numeric) && numeric > 0) {
              return { price: numeric, name: c.name ?? null };
            }
          }
        }
      }
    }
  }
  return null;
}

function extractFromRegexFallback(html) {
  // último recurso: procura "R$ 1.234,56" perto de palavras que indicam preço de venda
  const matches = [...html.matchAll(/R\$\s?([\d]{1,3}(?:\.\d{3})*,\d{2})/g)];
  if (matches.length === 0) return null;
  const values = matches
    .map((m) => Number(m[1].replace(/\./g, '').replace(',', '.')))
    .filter((v) => v > 50 && v < 20000); // filtro grosseiro pra descartar frete/parcela/lixo
  if (values.length === 0) return null;
  return { price: Math.min(...values), name: null };
}

export async function fetchAndExtractPrice(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), fetchTimeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'pt-BR,pt;q=0.9' },
      signal: controller.signal,
      redirect: 'follow',
    });
    if (!res.ok) {
      return { ok: false, reason: `http_${res.status}` };
    }
    const finalUrl = res.url;
    const html = await res.text();

    const jsonLd = extractFromJsonLd(html);
    const result = jsonLd ?? extractFromRegexFallback(html);
    if (!result) {
      return { ok: false, reason: 'price_not_found' };
    }

    return {
      ok: true,
      price: result.price,
      name: result.name,
      finalUrl,
      method: jsonLd ? 'jsonld' : 'regex_fallback',
    };
  } catch (err) {
    return { ok: false, reason: err.name === 'AbortError' ? 'timeout' : 'fetch_error' };
  } finally {
    clearTimeout(timeout);
  }
}
