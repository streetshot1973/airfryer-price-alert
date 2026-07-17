import fs from 'node:fs';
import path from 'node:path';
import {
  SEARCH_QUERY,
  includeTerms,
  excludeTerms,
  blockedUrlPatterns,
  maxResultsToVisit,
  stateFilePath,
} from './config.mjs';
import { searchDuckDuckGo } from './search.mjs';
import { fetchAndExtractPrice } from './extractPrice.mjs';
import { sendPriceDropEmail } from './email.mjs';

const PRODUCT_LABEL = 'Air Fryer Electrolux EAF90 (Rita Lobo, com espeto giratório)';

function titleMatches(title, url) {
  const lower = `${title} ${url}`.toLowerCase();
  if (excludeTerms.some((term) => lower.includes(term))) return false;
  return includeTerms.every((synonyms) => synonyms.some((term) => lower.includes(term)));
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
  } catch {
    return null;
  }
}

function saveState(state) {
  fs.mkdirSync(path.dirname(stateFilePath), { recursive: true });
  fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2) + '\n', 'utf8');
}

async function main() {
  console.log(`[${new Date().toISOString()}] Buscando: "${SEARCH_QUERY}"`);
  const searchResults = await searchDuckDuckGo(SEARCH_QUERY);
  console.log(`  ${searchResults.length} links encontrados na busca.`);

  const candidates = searchResults
    .filter((r) => titleMatches(r.title, r.url))
    .filter((r) => !blockedUrlPatterns.some((re) => re.test(r.url)))
    .slice(0, maxResultsToVisit);

  console.log(`  ${candidates.length} candidatos após filtro (EAF90, sem EAF85/peças/whatsapp).`);

  const offers = [];
  const unconfirmed = [];
  for (const c of candidates) {
    const result = await fetchAndExtractPrice(c.url);
    if (!result.ok) {
      console.log(`  SKIP (${result.reason})  ${c.url}`);
      continue;
    }

    // revalida o NOME real extraído da página (não só o snippet da busca) contra o
    // mesmo filtro de modelo — pega casos como catálogo errado do comparador (ex:
    // Buscapé listando "EAF9 ... 3,5l" na URL do EAF90).
    const nameLooksRight = result.name ? titleMatches(result.name, '') : false;

    if (result.method === 'jsonld' && nameLooksRight) {
      console.log(`  OK             R$ ${result.price}  ${c.url}  [${result.name}]`);
      offers.push({ price: result.price, name: result.name, finalUrl: result.finalUrl ?? c.url });
    } else {
      const why = result.method !== 'jsonld' ? 'sem JSON-LD' : 'nome da página não bate com o modelo esperado';
      console.log(`  NAO CONFIRMADO R$ ${result.price}  ${c.url}  (${why}: "${result.name ?? c.title}")`);
      unconfirmed.push({ price: result.price, name: result.name ?? c.title, finalUrl: result.finalUrl ?? c.url });
    }
  }

  if (offers.length === 0) {
    console.log(
      `Nenhuma oferta confirmada via JSON-LD nessa checagem (${unconfirmed.length} não confirmadas ignoradas). Não atualiza estado, não envia e-mail.`
    );
    return;
  }

  const best = offers.reduce((min, o) => (o.price < min.price ? o : min), offers[0]);
  console.log(`Menor preço encontrado: R$ ${best.price} (${best.finalUrl})`);

  const previousState = loadState();
  const now = new Date().toISOString();

  if (previousState && typeof previousState.lowestPrice === 'number') {
    if (best.price < previousState.lowestPrice) {
      console.log(`Preço caiu: R$ ${previousState.lowestPrice} -> R$ ${best.price}. Enviando e-mail.`);
      await sendPriceDropEmail({
        to: process.env.ALERT_EMAIL,
        productLabel: PRODUCT_LABEL,
        previousPrice: previousState.lowestPrice,
        currentPrice: best.price,
        offer: best,
        allOffers: offers,
      });
    } else {
      console.log('Preço não caiu em relação à última checagem. Nenhum e-mail enviado.');
    }
  } else {
    console.log('Primeira checagem registrada (sem histórico anterior). Nenhum e-mail enviado.');
  }

  saveState({
    lowestPrice: best.price,
    bestOffer: best,
    allOffers: offers,
    checkedAt: now,
  });
}

main().catch((err) => {
  console.error('Falha na checagem:', err);
  process.exitCode = 1;
});
