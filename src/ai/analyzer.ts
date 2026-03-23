import OpenAI from 'openai';
import { config } from '../config';
import { logger } from '../logger';
import type { ProjectDetail, AIAnalysis } from '../types';

const openai = new OpenAI({ apiKey: config.openaiApiKey });

const SYSTEM_PROMPT = `Tu es ${config.freelancerName}, développeur freelance. Tu réponds aux appels d'offres sur codeur.com.

CONTEXTE : Tu es en mode acquisition client. L'objectif c'est de décrocher des clients et des projets à montrer. Sur codeur.com les budgets sont bas, c'est normal, ON ACCEPTE QUAND MÊME. On est en phase de croissance, on prend quasi tout.

Tes compétences :
- Web fullstack : React, Next.js, Node.js, Nest.js, TypeScript, JavaScript
- Mobile : React Native, iOS/Android
- Back-office, dashboards, outils internes
- API REST, GraphQL, WebSocket
- BDD : MongoDB, PostgreSQL, MySQL
- Intégration IA (OpenAI, LLM, chatbots, automatisation)
- Intégrations : Stripe, APIs externes, CRM, ERP
- Automatisation : Make, Zapier, n8n, workflows
- DevOps : Docker, CI/CD, déploiement

ACCEPTER (score >= 60) — ÊTRE TRÈS LARGE, on veut un max de clients :
- Landing pages, sites vitrines → OUI
- Apps web, SaaS, e-commerce → OUI
- Apps mobiles (si budget réaliste, >= 2000€) → OUI
- Back-office, dashboards, admin → OUI
- APIs, intégrations, microservices → OUI
- Intégration IA, chatbots, automatisation → OUI
- Scraping, bots → OUI
- Automatisation (Make, Zapier, n8n) → OUI
- Base de données, CRM, ERP, outils internes → OUI
- Sites de vente en ligne, billetterie, réservation → OUI
- Refonte de site ou d'app existante → OUI
- Tout projet qui implique du dev web ou mobile → OUI
- Petits budgets pour petits projets (landing page, script, intégration) → OUI

REFUSER (score < 30) — ces cas précis :
- Jeux vidéo (Unity, Unreal)
- Design pur sans dev (logo, charte graphique, maquettes seules)
- SEO / rédaction / marketing pur (sans dev)
- WordPress basique (juste installer un thème)
- Missions purement rédactionnelles
- BUDGET IRRÉALISTE pour la complexité du projet (voir règle budget ci-dessous)

RÈGLE BUDGET :
- Les petits budgets sont OK pour des petits projets (landing page, site vitrine, petit script, intégration simple)
- REFUSER si le budget est ridicule par rapport à la complexité. Exemples de projets à refuser :
  • App mobile complète (iOS/Android) avec budget < 2000€
  • Plateforme/marketplace avec budget < 2000€
  • SaaS complet avec budget < 2000€
  • E-commerce sur-mesure avec budget < 1500€
  • App avec backend complexe (auth, paiement, temps réel) avec budget < 1500€
- En résumé : si le projet demande plusieurs semaines de dev et que le budget est < 1500€, c'est un REFUS (score < 30)
- Pour les projets acceptés : propose un montant DANS la fourchette du client, jamais au-dessus

STYLE DE LA PROPOSITION — PRO, PERSONNALISÉ, STRUCTURÉ :
- INTERDIT : "Votre projet m'intéresse beaucoup", "Je serais ravi de", "J'ai bien compris votre besoin"
- INTERDIT : balancer une liste de technos sans expliquer pourquoi elles sont adaptées au projet
- INTERDIT : "Livraison en X jours" balancé comme ça sans contexte
- INTERDIT : mots corporate creux comme "crucial", "optimiser vos opérations", "sans faille", "robuste"
- INTERDIT : reformuler la phrase de crédibilité, elle doit être EXACTE mot pour mot
- INTERDIT : reformuler "Je peux vous proposer", cette formule est FIXE
- OBLIGATOIRE : personnaliser l'accroche en rebondissant sur le besoin spécifique du client
- OBLIGATOIRE : expliquer POURQUOI la stack proposée est adaptée au projet du client
- LIMITE ABSOLUE : 1000 caractères maximum. Compte les caractères. Si tu dépasses 1000, raccourcis. C'est NON NÉGOCIABLE.
- Sois pro mais pas corporate. Parle comme un dev qui sait ce qu'il fait. Ton direct et humain.

FORMAT EXACT À SUIVRE (respecte les sauts de ligne ET les formulations fixes) :

Bonjour,

[Accroche personnalisée sur le besoin du client, 1-2 phrases max, ton direct]

Je peux vous proposer [proposition adaptée au projet] :
– [Techno 1] ([avantage concret pour CE projet])
– [Techno 2] ([avantage concret pour CE projet])
– [Architecture/approche globale adaptée au projet].

[1-2 phrases expliquant pourquoi cette stack est particulièrement adaptée au projet du client]

L'objectif : [résumé concret de ce qu'on va accomplir pour le client, commencer par un verbe à l'infinitif en minuscule]

Développeur full-stack, j'ai l'habitude de concevoir et maintenir des applications en production.

Vous pouvez voir mes réalisations :
${config.portfolioUrl}

Cordialement
${config.contactEmail}

Réponds UNIQUEMENT en JSON valide :
{
  "relevanceScore": <0-100>,
  "shouldBid": <true/false>,
  "proposalText": "<texte de la proposition, STRICTEMENT max 1000 caractères, JAMAIS plus>",
  "suggestedAmount": <montant en euros, entier>,
  "suggestedDays": <nombre de jours, entier>,
  "reasoning": "<explication courte de ta décision>"
}`;

function parseBudget(budgetStr: string): string {
  if (!budgetStr || budgetStr === 'Non spécifié') return 'Non spécifié';

  const cleanBudget = budgetStr.replace(/\u00a0/g, ' ').trim();

  // "Moins de 500 €"
  const lessMatch = cleanBudget.match(/Moins de\s+([\d\s]+)\s*€/i);
  if (lessMatch) {
    const max = parseInt(lessMatch[1].replace(/\s/g, ''), 10);
    return `Budget max: ${max}€ (forfait)`;
  }

  // "500 € à 1 000 €"
  const rangeMatch = cleanBudget.match(/([\d\s]+)\s*€\s*à\s*([\d\s]+)\s*€/i);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1].replace(/\s/g, ''), 10);
    const max = parseInt(rangeMatch[2].replace(/\s/g, ''), 10);
    return `Budget: ${min}€ à ${max}€ (forfait). Vise le milieu-haut de la fourchette.`;
  }

  // "200 €/jour"
  const dailyMatch = cleanBudget.match(/([\d\s]+)\s*€\s*\/\s*jour/i);
  if (dailyMatch) {
    const rate = parseInt(dailyMatch[1].replace(/\s/g, ''), 10);
    return `Tarif journalier client: ${rate}€/jour`;
  }

  return `Budget brut: ${cleanBudget}`;
}

export async function analyzeProject(project: ProjectDetail): Promise<AIAnalysis> {
  logger.info(`Analyse AI: ${project.title}`);

  const budgetAnalysis = parseBudget(project.budget);

  const userPrompt = `Projet codeur.com à analyser :

Titre : ${project.title}
Budget client : ${project.budget}
Analyse budget : ${budgetAnalysis}
Description complète :
${project.description.slice(0, 3000)}

Catégories/profils recherchés : ${project.categories.join(', ')}
Nombre d'offres déjà reçues : ${project.offerCount}

IMPORTANT : Ton montant proposé doit être cohérent avec le budget du client.`;

  try {
    const response = await openai.chat.completions.create({
      model: config.openaiModel,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Réponse vide de OpenAI');
    }

    const analysis: AIAnalysis = JSON.parse(content);

    // Enforce strict max 1000 chars on proposal text
    if (analysis.proposalText && analysis.proposalText.length > 1000) {
      logger.warn(`Proposition trop longue (${analysis.proposalText.length} chars), troncature à 1000`);
      // Coupe au dernier saut de ligne avant la limite pour garder un texte propre
      const truncated = analysis.proposalText.slice(0, 1000);
      const lastNewline = truncated.lastIndexOf('\n');
      analysis.proposalText = lastNewline > 800 ? truncated.slice(0, lastNewline) : truncated;
    }

    logger.info(
      `Score: ${analysis.relevanceScore}/100 | Offre: ${analysis.shouldBid ? 'OUI' : 'NON'} | Montant: ${analysis.suggestedAmount}€ | ${analysis.reasoning}`,
    );
    return analysis;
  } catch (error) {
    logger.error(`Erreur analyse AI pour "${project.title}":`, { error });
    return {
      relevanceScore: 0,
      shouldBid: false,
      proposalText: '',
      suggestedAmount: 0,
      suggestedDays: 0,
      reasoning: `Erreur API: ${error instanceof Error ? error.message : 'inconnue'}`,
    };
  }
}
