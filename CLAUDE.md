# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bot d'auto-proposition pour codeur.com. Il scrape les annonces de projets dev, les analyse via OpenAI, et soumet automatiquement des propositions personnalisées.

## Commands

- `npm run dev` — Lance le bot en mode développement (tsx)
- `npm run dry-run` — Lance en mode DRY_RUN (pas de soumission réelle)
- `npm run build` — Compile TypeScript vers `dist/`
- `npm start` — Lance la version compilée
- `npm run test-ai` — Test isolé de l'analyse AI

## Architecture

Pipeline séquentiel orchestré par un cron (`node-cron`) :

1. **Browser** (`src/scraper/browser.ts`) — Puppeteer + Stealth plugin, injection de cookies codeur.com
2. **List Scraper** (`src/scraper/listScraper.ts`) — Scrape la liste des projets via clics "Afficher plus"
3. **Detail Scraper** (`src/scraper/detailScraper.ts`) — Scrape le détail de chaque projet
4. **AI Analyzer** (`src/ai/analyzer.ts`) — OpenAI analyse le projet et génère la proposition (JSON structured output)
5. **Proposal Submitter** (`src/submitter/proposalSubmitter.ts`) — Remplit et soumet le formulaire d'offre
6. **Project Tracker** (`src/tracker/projectTracker.ts`) — SQLite (better-sqlite3) pour éviter les doublons

`src/pipeline.ts` orchestre les étapes 1-6. `src/scheduler/cron.ts` planifie l'exécution périodique.

## Key Configuration

Tout via `.env` (voir `.env.example`). Points importants :
- `DRY_RUN=true` par défaut — le bot ne soumet PAS sauf si explicitement `false`
- `CODEUR_COOKIES` — cookies de session copiés depuis DevTools (expirables)
- `HEADLESS=true` — mode headless Puppeteer
- L'AI est configurée pour accepter quasi tous les projets dev (mode acquisition)

## Constraints

- Les propositions générées doivent faire **max 1 000 caractères**
- Le prompt AI dans `analyzer.ts` a un format de proposition strict — ne pas modifier sans accord
- Le keyword filter (`src/filter/keywordFilter.ts`) existe mais n'est PAS utilisé dans le pipeline actuel (l'AI fait le tri)

## Data

- `data/projects.db` — SQLite, historique des projets traités
- `data/bot.log` — Logs fichier (winston, rotation 10MB × 3)
