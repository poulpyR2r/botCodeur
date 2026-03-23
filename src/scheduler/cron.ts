import cron from 'node-cron';
import { runPipeline } from '../pipeline';
import { logger } from '../logger';

let isRunning = false;

export function startScheduler(intervalMinutes: number): void {
  logger.info(`Scheduler démarré: exécution toutes les ${intervalMinutes} minutes`);

  // Run immediately on startup
  executePipeline();

  // Then schedule periodic runs
  const cronExpression = `*/${intervalMinutes} * * * *`;
  cron.schedule(cronExpression, () => {
    executePipeline();
  });
}

async function executePipeline(): Promise<void> {
  if (isRunning) {
    logger.warn('Pipeline déjà en cours, cycle ignoré');
    return;
  }

  isRunning = true;
  try {
    await runPipeline();
  } catch (error) {
    logger.error('Pipeline échoué:', { error });
  } finally {
    isRunning = false;
  }
}
