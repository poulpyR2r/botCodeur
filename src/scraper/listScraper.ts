import type { Page } from 'puppeteer';
import { config } from '../config';
import { logger } from '../logger';
import { randomDelay } from './browser';
import type { ProjectListing } from '../types';

const LOAD_MORE_SELECTOR = '#load-more-button .btn.btn-outline-primary';

async function loadAllListings(page: Page, maxClicks: number): Promise<void> {
  for (let click = 1; click <= maxClicks; click++) {
    // Scroller en bas de page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await randomDelay(1000, 2000);

    // Attendre que le bouton apparaisse (max 5s)
    try {
      await page.waitForSelector(LOAD_MORE_SELECTOR, { visible: true, timeout: 5000 });
    } catch {
      logger.info(`Bouton "Afficher plus" introuvable après ${click - 1} clics — toutes les annonces sont chargées`);
      break;
    }

    const button = await page.$(LOAD_MORE_SELECTOR);
    if (!button) {
      logger.info(`Bouton "Afficher plus" introuvable après ${click - 1} clics — toutes les annonces sont chargées`);
      break;
    }

    await button.evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    await randomDelay(500, 1000);
    await button.click();

    logger.info(`Clic "Afficher plus" ${click}/${maxClicks}`);

    // Attendre le chargement (Turbo Stream)
    await randomDelay(2000, 4000);
    try {
      await page.waitForNetworkIdle({ idleTime: 500, timeout: 10000 });
    } catch {
      // Timeout acceptable
    }
  }
}

export async function scrapeProjectListings(page: Page, maxClicks: number): Promise<ProjectListing[]> {
  logger.info(`Scraping: ${config.scrapeUrl} (max ${maxClicks} clics "Afficher plus")`);

  await page.goto(config.scrapeUrl, { waitUntil: 'networkidle2', timeout: 30000 });
  await randomDelay(2000, 3000);

  // Charger plus d'annonces
  await loadAllListings(page, maxClicks);

  // Extraire toutes les annonces de .search-content
  const projects = await page.evaluate(() => {
    const results: Array<{
      id: string;
      slug: string;
      url: string;
      title: string;
      budget: string;
      offerCount: number;
      categories: string[];
      postedAgo: string;
    }> = [];

    const container = document.querySelector('.search-content') || document;
    const projectLinks = container.querySelectorAll('a[href*="/projects/"]');
    const seen = new Set<string>();

    projectLinks.forEach((link: Element) => {
      const href = link.getAttribute('href');
      if (!href) return;

      const match = href.match(/\/projects\/(\d+)-(.+)/);
      if (!match) return;

      const id = match[1];
      if (seen.has(id)) return;
      seen.add(id);

      const title = link.textContent?.trim() || '';
      if (!title || title.length < 5) return;

      let card: Element | null = link.parentElement;
      for (let i = 0; i < 5 && card; i++) {
        if (card.querySelector('a[href*="/projects/"]') === link) {
          break;
        }
        card = card.parentElement;
      }
      if (!card) card = link.parentElement;
      if (!card) return;

      const cardText = card.textContent || '';

      const budgetMatch = cardText.match(/((?:Moins de |Entre )?\d[\d\s]*€(?:\s*(?:à|\/jour)\s*\d[\d\s]*€?)?(?:\/jour)?)/i);
      const budget = budgetMatch ? budgetMatch[1].replace(/\s+/g, ' ').trim() : 'Non spécifié';

      const offerMatch = cardText.match(/(\d+)\s*offres?/i);
      const offerCount = offerMatch ? parseInt(offerMatch[1], 10) : 0;

      const categoryLinks = card.querySelectorAll('a[href*="/users/c/"]');
      const categories: string[] = [];
      categoryLinks.forEach((el: Element) => {
        const text = el.textContent?.trim();
        if (text && text.length > 2) categories.push(text);
      });

      const timeMatch = cardText.match(/Il y a\s+[^\n·]+/i);
      const postedAgo = timeMatch ? timeMatch[0].trim() : '';

      results.push({
        id,
        slug: match[2],
        url: href,
        title,
        budget,
        offerCount,
        categories: [...new Set(categories)].slice(0, 5),
        postedAgo,
      });
    });

    return results;
  });

  logger.info(`Total: ${projects.length} projets scrapés`);
  return projects;
}
