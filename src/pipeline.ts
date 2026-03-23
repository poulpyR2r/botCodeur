import { config } from './config';
import { logger } from './logger';
import { createBrowser, closeBrowser, randomDelay } from './scraper/browser';
import { scrapeProjectListings } from './scraper/listScraper';
import { scrapeProjectDetail } from './scraper/detailScraper';

import { analyzeProject } from './ai/analyzer';
import { submitProposal } from './submitter/proposalSubmitter';
import { isProjectProcessed, markProjectProcessed, getStats } from './tracker/projectTracker';
import type { TrackedProject } from './types';

export async function runPipeline(): Promise<void> {
  const startTime = Date.now();
  logger.info('=== Pipeline démarré ===');

  const { browser, page } = await createBrowser();

  try {
    // 1. Check auth by navigating to the dev projects page
    await page.goto(config.scrapeUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    const currentUrl = page.url();
    if (currentUrl.includes('login') || currentUrl.includes('sign_in')) {
      logger.error('Cookies expirés ! Mettez à jour CODEUR_COOKIES dans .env');
      return;
    }

    // 2. Scrape listings
    const allListings = await scrapeProjectListings(page, config.scrapePages);

    // 3. Filter already processed
    const newListings = allListings.filter((p) => {
      if (isProjectProcessed(p.id)) {
        logger.debug(`Déjà traité: ${p.title}`);
        return false;
      }
      return true;
    });
    logger.info(`${newListings.length} nouveaux projets (${allListings.length - newListings.length} déjà traités)`);

    if (newListings.length === 0) {
      logger.info('Aucun nouveau projet à traiter');
      return;
    }

    // 4. Process each project (l'IA décide de la pertinence)
    let bidCount = 0;
    for (const listing of newListings) {
      try {
        // 5a. Scrape full details
        const detail = await scrapeProjectDetail(page, listing);

        // 5b. AI analysis
        const analysis = await analyzeProject(detail);

        // 5c. Submit or skip
        let bidSubmitted = false;
        if (analysis.shouldBid) {
          bidSubmitted = await submitProposal(page, detail, analysis);
          if (bidSubmitted) bidCount++;
        } else {
          logger.info(`Skippé (score ${analysis.relevanceScore}): ${detail.title}`);
        }

        // 5d. Track
        const tracked: TrackedProject = {
          id: detail.id,
          title: detail.title,
          url: detail.url,
          processedAt: new Date().toISOString(),
          relevanceScore: analysis.relevanceScore,
          bidSubmitted,
          bidAmount: analysis.shouldBid ? analysis.suggestedAmount : null,
          bidDays: analysis.shouldBid ? analysis.suggestedDays : null,
          proposalText: analysis.shouldBid ? analysis.proposalText : null,
        };
        markProjectProcessed(tracked);

        // 5e. Delay between projects
        await randomDelay(5000, 15000);
      } catch (error) {
        logger.error(`Erreur sur projet "${listing.title}":`, { error });
        continue;
      }
    }

    // 6. Summary
    const stats = getStats();
    const duration = Math.round((Date.now() - startTime) / 1000);
    logger.info('=== Pipeline terminé ===');
    logger.info(`Durée: ${duration}s | Propositions envoyées: ${bidCount} | Total traités: ${stats.total} | Total offres: ${stats.bids}`);
  } finally {
    await closeBrowser(browser);
  }
}
