import type { Page } from 'puppeteer';
import { config } from '../config';
import { logger } from '../logger';
import { randomDelay } from '../scraper/browser';
import type { ProjectDetail, AIAnalysis } from '../types';

export async function submitProposal(
  page: Page,
  project: ProjectDetail,
  analysis: AIAnalysis,
): Promise<boolean> {
  const url = project.url.startsWith('http') ? project.url : `${config.baseUrl}${project.url}`;
  logger.info(`Soumission proposition pour: ${project.title}`);

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await randomDelay(2000, 4000);

    // 1. Vérifier si on a déjà postulé ("Offre déposée")
    const alreadyBid = await page.evaluate(() => {
      const actions = document.querySelector('#project-actions');
      return actions?.textContent?.includes('Offre déposée') ?? false;
    });

    if (alreadyBid) {
      logger.info(`Déjà postulé, on skip: ${project.title}`);
      return false;
    }

    // 2. Cliquer sur "Faire une offre" pour charger le formulaire via AJAX
    const makeOfferBtn = await page.$('a.btn-primary[data-remote="true"][data-url*="/offers/new"]');
    if (!makeOfferBtn) {
      logger.warn(`Bouton "Faire une offre" non trouvé pour: ${project.title}`);
      return false;
    }

    await makeOfferBtn.evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    await randomDelay(500, 1000);
    await makeOfferBtn.click();

    // Attendre que le formulaire se charge (AJAX)
    try {
      await page.waitForSelector('#offer_amount', { visible: true, timeout: 10000 });
    } catch {
      logger.warn(`Formulaire d'offre non chargé pour: ${project.title}`);
      return false;
    }
    await randomDelay(1000, 2000);

    // Scroller jusqu'au champ montant
    await page.evaluate(() => {
      const field = document.querySelector('#offer_amount');
      if (field) field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await randomDelay(500, 1000);

    const amountField = await page.$('#offer_amount');
    if (!amountField) {
      logger.warn(`Champ montant non trouvé pour: ${project.title}`);
      return false;
    }

    // 3. Montant
    await amountField.click({ clickCount: 3 });
    await amountField.type(String(analysis.suggestedAmount), { delay: 20 });
    logger.debug(`Montant: ${analysis.suggestedAmount}€`);

    // 4. Mode tarif : "flat_rate" (pour le projet)
    await page.select('#offer_pricing_mode', 'flat_rate');

    // 5. Délai en jours
    const durationField = await page.$('#offer_duration');
    if (durationField) {
      await durationField.click({ clickCount: 3 });
      await durationField.type(String(analysis.suggestedDays), { delay: 20 });
      logger.debug(`Délai: ${analysis.suggestedDays} jours`);
    }

    // 6. Message privé (textarea)
    const messageField = await page.$('#offer_comments_attributes_0_content');
    if (messageField) {
      await messageField.click();
      await messageField.type(analysis.proposalText, { delay: 5 });
      logger.debug(`Message: ${analysis.proposalText.length} caractères`);
    }

    await randomDelay(1000, 2000);

    // DRY RUN : on ne soumet pas
    if (config.dryRun) {
      logger.info(`[DRY RUN] Proposition prête mais NON soumise pour: ${project.title}`);
      logger.info(`[DRY RUN] Montant: ${analysis.suggestedAmount}€ | Délai: ${analysis.suggestedDays}j`);
      logger.info(`[DRY RUN] Message (${analysis.proposalText.length} chars): ${analysis.proposalText.slice(0, 200)}...`);
      return false;
    }

    // 7. Submit — "Publier mon offre"
    const submitBtn = await page.$('input[type="submit"][data-level="standard"]');
    if (!submitBtn) {
      logger.warn(`Bouton "Publier mon offre" non trouvé pour: ${project.title}`);
      return false;
    }

    await submitBtn.evaluate((el) => (el as HTMLInputElement).disabled = false);
    await randomDelay(500, 1000);
    await submitBtn.click();

    await randomDelay(3000, 5000);
    try {
      await page.waitForNetworkIdle({ idleTime: 1000, timeout: 10000 });
    } catch {
      // ok
    }

    logger.info(`Proposition soumise pour: ${project.title}`);
    return true;
  } catch (error) {
    logger.error(`Erreur soumission pour "${project.title}":`, { error });
    return false;
  }
}
