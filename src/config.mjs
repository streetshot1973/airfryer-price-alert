import { fileURLToPath } from 'node:url';

export const SEARCH_QUERY = 'airfryer eletrolux eaf90 rita lobo espeto giratório preço';

// título+URL precisam bater com todos os termos de includeTerms (case-insensitive, qualquer um
// dos sinônimos dentro de cada sub-array conta) e não podem conter nenhum termo de excludeTerms.
// EAF90 (com espeto giratório) x EAF85 (sem espeto) já é distinção suficiente pelo código do
// modelo — não precisa exigir "espeto" separadamente, os títulos do DuckDuckGo vêm truncados.
export const includeTerms = [['eaf90']];

export const excludeTerms = ['eaf85', 'eaf91', 'motor', 'visor', 'peça', 'peca', 'reposição', 'reposicao'];

export const blockedUrlPatterns = [/wa\.me\//i, /api\.whatsapp\.com/i, /whatsapp\.com/i];

export const maxResultsToVisit = 15;
export const fetchTimeoutMs = 10000;

export const stateFilePath = fileURLToPath(new URL('../data/last-price.json', import.meta.url));
