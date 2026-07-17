import { fileURLToPath } from 'node:url';

export const SEARCH_QUERY = 'air fryer kitchen art 16l 4 em 1 espeto rotisserie kaf16a 127v preço';

// título+URL precisam bater com todos os termos de includeTerms (case-insensitive, qualquer um
// dos sinônimos dentro de cada sub-array conta) e não podem conter nenhum termo de excludeTerms.
// KAF16A é o código do modelo 127V — exclui a variante 220V e peças avulsas.
export const includeTerms = [['kaf16a']];

export const excludeTerms = ['220v', 'motor', 'visor', 'peça', 'peca', 'reposição', 'reposicao'];

export const blockedUrlPatterns = [/wa\.me\//i, /api\.whatsapp\.com/i, /whatsapp\.com/i];

export const maxResultsToVisit = 15;
export const fetchTimeoutMs = 10000;

export const stateFilePath = fileURLToPath(new URL('../data/last-price.json', import.meta.url));
