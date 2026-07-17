import nodemailer from 'nodemailer';

function getTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error('GMAIL_USER e GMAIL_APP_PASSWORD precisam estar definidos (secrets do GitHub Actions).');
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

export async function sendPriceDropEmail({ to, productLabel, previousPrice, currentPrice, offer, allOffers }) {
  const transport = getTransport();
  const from = process.env.GMAIL_USER;

  const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const offersList = allOffers
    .sort((a, b) => a.price - b.price)
    .map((o) => `- ${fmt(o.price)} — ${o.name ?? o.finalUrl}\n  ${o.finalUrl}`)
    .join('\n\n');

  const subject = `📉 ${productLabel}: preço caiu para ${fmt(currentPrice)}`;
  const text = `O preço caiu!

Última checagem: ${fmt(previousPrice)}
Agora: ${fmt(currentPrice)}

Melhor oferta encontrada:
${offer.name ?? offer.finalUrl}
${fmt(offer.price)}
${offer.finalUrl}

Todas as ofertas válidas encontradas nessa checagem:

${offersList}
`;

  await transport.sendMail({ from, to, subject, text });
}
