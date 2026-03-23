import { config } from './config';
import { initDatabase } from './tracker/projectTracker';
import { startScheduler } from './scheduler/cron';
import { logger } from './logger';

async function main(): Promise<void> {
  logger.info('========================================');
  logger.info('  codeur.com Auto-Proposal Bot');
  logger.info('========================================');
  logger.info(`Mode: ${config.dryRun ? 'DRY RUN (pas de soumission)' : 'LIVE'}`);
  logger.info(`Intervalle: toutes les ${config.scrapeIntervalMinutes} minutes`);
  logger.info(`Pages à scraper: ${config.scrapePages}`);
  logger.info(`Mots-clés: ${config.filterKeywords.join(', ')}`);
  logger.info(`Modèle AI: ${config.openaiModel}`);
  logger.info('----------------------------------------');

  initDatabase();
  startScheduler(config.scrapeIntervalMinutes);
}

main().catch((err) => {
  logger.error('Erreur fatale:', { error: err });
  process.exit(1);
});
