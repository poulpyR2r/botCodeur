import Database from 'better-sqlite3';
import path from 'path';
import { logger } from '../logger';
import type { TrackedProject } from '../types';

const DB_PATH = path.resolve(__dirname, '..', '..', 'data', 'projects.db');

let db: Database.Database;

export function initDatabase(): void {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      processed_at TEXT NOT NULL,
      relevance_score INTEGER DEFAULT 0,
      bid_submitted INTEGER DEFAULT 0,
      bid_amount REAL,
      bid_days INTEGER,
      proposal_text TEXT
    )
  `);

  logger.info('Base de données initialisée');
}

export function isProjectProcessed(projectId: string): boolean {
  const row = db.prepare('SELECT id FROM projects WHERE id = ?').get(projectId);
  return !!row;
}

export function markProjectProcessed(project: TrackedProject): void {
  db.prepare(`
    INSERT OR REPLACE INTO projects (id, title, url, processed_at, relevance_score, bid_submitted, bid_amount, bid_days, proposal_text)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    project.id,
    project.title,
    project.url,
    project.processedAt,
    project.relevanceScore,
    project.bidSubmitted ? 1 : 0,
    project.bidAmount,
    project.bidDays,
    project.proposalText,
  );
}

export function getStats(): { total: number; bids: number; skipped: number } {
  const total = (db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number }).count;
  const bids = (db.prepare('SELECT COUNT(*) as count FROM projects WHERE bid_submitted = 1').get() as { count: number }).count;
  return { total, bids, skipped: total - bids };
}
