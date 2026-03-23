import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Browser, Page } from 'puppeteer';
import { config } from '../config';
import { logger } from '../logger';

puppeteer.use(StealthPlugin());

export async function randomDelay(minMs = 1000, maxMs = 3000): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export async function createBrowser(): Promise<{ browser: Browser; page: Page }> {
  logger.info('Lancement du navigateur...');

  const browser = await puppeteer.launch({
    headless: config.headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1920,1080',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  );

  await page.setCookie(...config.codeurCookies);
  logger.info(`${config.codeurCookies.length} cookies injectés`);

  return { browser, page };
}

export async function closeBrowser(browser: Browser): Promise<void> {
  await browser.close();
  logger.info('Navigateur fermé');
}
