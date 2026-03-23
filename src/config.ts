import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Variable d'environnement requise manquante: ${key}`);
  }
  return value;
}

function parseCookies(raw: string) {
  return raw.split(';').map((pair) => {
    const [name, ...rest] = pair.trim().split('=');
    return {
      name: name.trim(),
      value: rest.join('=').trim(),
      domain: '.codeur.com',
      path: '/',
    };
  });
}

export const config = {
  codeurCookies: parseCookies(required('CODEUR_COOKIES')),
  openaiApiKey: required('OPENAI_API_KEY'),
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o',
  scrapePages: parseInt(process.env.SCRAPE_PAGES || '6', 10),
  scrapeIntervalMinutes: parseInt(process.env.SCRAPE_INTERVAL_MINUTES || '15', 10),
  baseUrl: process.env.BASE_URL || 'https://www.codeur.com',
  scrapeUrl: process.env.SCRAPE_URL || 'https://www.codeur.com/developpeur',
  filterKeywords: (process.env.FILTER_KEYWORDS || 'next,react,node,nest,mongodb,typescript').split(',').map((k) => k.trim().toLowerCase()),
  defaultDailyRate: parseInt(process.env.DEFAULT_DAILY_RATE || '450', 10),
  defaultDeliveryDays: parseInt(process.env.DEFAULT_DELIVERY_DAYS || '14', 10),
  dryRun: process.env.DRY_RUN !== 'false',
  headless: process.env.HEADLESS !== 'false',
  logLevel: process.env.LOG_LEVEL || 'info',
  freelancerName: required('FREELANCER_NAME'),
  portfolioUrl: required('PORTFOLIO_URL'),
  contactEmail: required('CONTACT_EMAIL'),
} as const;
