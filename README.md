# codeur-bot

Bot d'auto-proposition pour [codeur.com](https://www.codeur.com). Scrape les annonces de projets dev, les analyse via OpenAI, et soumet automatiquement des propositions personnalisées.

## Fonctionnement

```
Cron (toutes les X min)
  │
  ├─ 1. Scrape la liste des projets (Puppeteer + Stealth)
  ├─ 2. Scrape le détail de chaque projet
  ├─ 3. Analyse AI → décision + génération de proposition
  ├─ 4. Soumission automatique du formulaire d'offre
  └─ 5. Tracking SQLite pour éviter les doublons
```

## Stack

- **TypeScript** — code source intégralement typé
- **Puppeteer** + `puppeteer-extra-plugin-stealth` — scraping headless
- **OpenAI API** (GPT-4o) — analyse des projets et rédaction des propositions
- **SQLite** (`better-sqlite3`) — suivi des projets déjà traités
- **Winston** — logs avec rotation (10 MB × 3 fichiers)
- **node-cron** — planification des cycles de scraping

## Installation

```bash
git clone <repo-url>
cd codeur-bot
npm install
cp .env.example .env
```

Remplir le `.env` — en particulier :

| Variable | Description |
|---|---|
| `CODEUR_COOKIES` | Cookies de session codeur.com (DevTools > Application > Cookies) |
| `OPENAI_API_KEY` | Clé API OpenAI |
| `DRY_RUN` | `true` par défaut — aucune soumission réelle |
| `SCRAPE_PAGES` | Nombre de clics "Voir plus" (pages chargées) |
| `SCRAPE_INTERVAL_MINUTES` | Intervalle entre chaque cycle |
| `DEFAULT_DAILY_RATE` | TJM proposé (€) |
| `DEFAULT_DELIVERY_DAYS` | Délai de livraison proposé (jours) |
| `HEADLESS` | `true` pour le mode headless Puppeteer |

## Utilisation

```bash
# Mode développement (hot reload)
npm run dev

# Mode test — le bot tourne mais ne soumet rien
npm run dry-run

# Production
npm run build
npm start

# Tester l'analyse AI seule
npm run test-ai
```

## Architecture

```
src/
├── index.ts                  # Point d'entrée
├── pipeline.ts               # Orchestration du pipeline complet
├── config.ts                 # Variables d'environnement typées
├── types.ts                  # Types partagés
├── logger.ts                 # Configuration Winston
├── ai/
│   └── analyzer.ts           # Analyse OpenAI + génération de proposition
├── scraper/
│   ├── browser.ts            # Instance Puppeteer + injection cookies
│   ├── listScraper.ts        # Scraping liste des projets
│   └── detailScraper.ts      # Scraping détail d'un projet
├── submitter/
│   └── proposalSubmitter.ts  # Soumission du formulaire d'offre
├── filter/
│   └── keywordFilter.ts      # Filtre par mots-clés (non utilisé, l'AI fait le tri)
├── tracker/
│   └── projectTracker.ts     # SQLite — historique projets traités
└── scheduler/
    └── cron.ts               # Planification node-cron
```

## Données

| Fichier | Contenu |
|---|---|
| `data/projects.db` | Base SQLite — historique des projets |
| `data/bot.log` | Logs avec rotation automatique |

Ces fichiers sont générés automatiquement et gitignorés.

## Notes

- Les cookies codeur.com expirent — il faut les renouveler régulièrement
- Les propositions générées font **max 1 000 caractères**
- En mode `DRY_RUN=true`, le bot log les propositions sans les soumettre
- L'AI est configurée en mode acquisition : elle accepte quasi tous les projets dev

## Licence

Projet privé.
