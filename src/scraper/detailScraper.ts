import type { Page } from 'puppeteer';
import { config } from '../config';
import { logger } from '../logger';
import { randomDelay } from './browser';
import type { ProjectListing, ProjectDetail } from '../types';

export async function scrapeProjectDetail(page: Page, listing: ProjectListing): Promise<ProjectDetail> {
  const url = listing.url.startsWith('http') ? listing.url : `${config.baseUrl}${listing.url}`;
  logger.debug(`Scraping détail: ${listing.title} (${url})`);

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await randomDelay(1000, 3000);

  const detail = await page.evaluate(() => {
    // Title: h1 in the card
    const h1 = document.querySelector('h1');
    const title = h1?.textContent?.trim() || '';

    // Description: inside .project-description .content
    const descEl = document.querySelector('.project-description .content');
    const description = descEl?.textContent?.trim() || '';

    // Budget: span with tooltip "Budget indicatif"
    const budgetSpan = document.querySelector('[data-bs-original-title="Budget indicatif"]');
    let budget = '';
    if (budgetSpan) {
      // The budget text is in the next sibling span.font-semibold
      const parent = budgetSpan.closest('p');
      const boldSpan = parent?.querySelector('.font-semibold');
      budget = boldSpan?.textContent?.trim().replace(/\s+/g, ' ') || budgetSpan.textContent?.trim() || '';
    }

    // Offer count
    const offersSpan = document.querySelector('[data-bs-original-title="Nombre d\'offres"]');
    let offerCount = 0;
    if (offersSpan) {
      const match = offersSpan.textContent?.match(/(\d+)/);
      offerCount = match ? parseInt(match[1], 10) : 0;
    }

    // Categories/profiles: links in project-details
    const profileLinks = document.querySelectorAll('.project-details a[href*="/users/c/"]');
    const categories: string[] = [];
    profileLinks.forEach((el: Element) => {
      const text = el.textContent?.trim();
      if (text) categories.push(text);
    });

    // Client name: look for profile info
    let clientName: string | null = null;
    const clientEl = document.querySelector('.card a[href*="/users/"]');
    if (clientEl) {
      clientName = clientEl.textContent?.trim() || null;
    }

    return { title, description, budget, offerCount, categories, clientName };
  });

  return {
    ...listing,
    title: detail.title || listing.title,
    budget: detail.budget || listing.budget,
    offerCount: detail.offerCount || listing.offerCount,
    categories: detail.categories.length > 0 ? detail.categories : listing.categories,
    description: detail.description,
    clientName: detail.clientName,
  };
}
