# airfryer-price-alert

Rastreador de preço da Air Fryer Electrolux EAF90 (Rita Lobo, com espeto giratório).
Roda de hora em hora via GitHub Actions: busca no DuckDuckGo, visita as páginas de produto
encontradas, lê o preço (dado estruturado JSON-LD, com fallback por regex) e manda e-mail
quando o menor preço encontrado cai em relação à checagem anterior.

## Cobertura

Funciona bem para: loja oficial Electrolux, Amazon, e a maioria das lojas menores que
aparecem na busca. **Não funciona** para Mercado Livre, Magazine Luiza e Casas Bahia — esses
sites bloqueiam leitura automatizada mesmo em páginas de produto individuais.

## Configuração necessária no GitHub (Settings → Secrets and variables → Actions)

- `GMAIL_USER`: endereço Gmail que vai enviar o e-mail.
- `GMAIL_APP_PASSWORD`: senha de app gerada em https://myaccount.google.com/apppasswords
  (exige verificação em duas etapas ativada na conta). Não é a senha normal do Gmail.
- `ALERT_EMAIL`: endereço que vai receber o alerta.

## Rodar localmente

```bash
npm install
GMAIL_USER=... GMAIL_APP_PASSWORD=... ALERT_EMAIL=... npm run check
```

## Ajustar o produto rastreado

Edite `src/config.mjs`: `SEARCH_QUERY`, `includeTerms` (termos que o título precisa ter) e
`excludeTerms` (termos que descartam o resultado, ex: modelo errado).
