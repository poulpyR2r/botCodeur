import { config } from './config';
import { logger } from './logger';
import { analyzeProject } from './ai/analyzer';
import type { ProjectDetail } from './types';

const testProjects: ProjectDetail[] = [
  {
    id: '478175',
    slug: 'developpement-module-cagnotte-collaborative-avec-paiements-stripe',
    url: '/projects/478175-developpement-module-cagnotte-collaborative-avec-paiements-stripe',
    title: 'Développement module cagnotte collaborative avec paiements Stripe',
    budget: '500 € à 1 000 €',
    offerCount: 21,
    categories: ['Développeur spécifique', 'Intégrateur de systèmes de paiement en ligne', 'Développeur API', 'Spécialiste Stripe'],
    postedAgo: 'Il y a 2 heures',
    description: `Bonjour, je souhaite faire appel à un prestataire afin de développer un outil pour l'un de mes clients.

Le projet consiste à créer un système permettant, via un quiz en ligne, de qualifier un prospect (transmission des informations à un closer) et de générer automatiquement un événement de groupe (type cagnotte d'organisation d'enterrement de vie de garçon) avec lien partageable.

Je recherche un développeur pour réaliser la partie applicative suivante :

- Création automatique d'un événement
- Génération d'un lien unique partageable
- Paiement individuel de chaque participant via Stripe
- Affichage du montant total, montant collecté et solde restant de l'événement
- Liste des participants avec statut de paiement
- Interface simple d'administration pour suivre les groupes

Le quiz sera réalisé via un outil de formulaire en ligne (Typeform ou équivalent). Je reste ouvert aux suggestions si une autre solution facilite l'intégration.

Merci d'indiquer :
- Technologie recommandée
- Délai estimé
- Budget estimatif
- Exemples d'app similaires réalisées`,
    clientName: null,
  },
  {
    id: '478200',
    slug: 'refonte-site-ecommerce-react-nextjs',
    url: '/projects/478200-refonte-site-ecommerce-react-nextjs',
    title: 'Refonte complète site e-commerce React / Next.js',
    budget: '2 000 € à 5 000 €',
    offerCount: 8,
    categories: ['Développeur React', 'Développeur Node.js', 'Développeur front-end'],
    postedAgo: 'Il y a 45 minutes',
    description: `Bonjour,

Nous sommes une marque de cosmétiques bio et nous souhaitons refondre entièrement notre site e-commerce actuellement sous WordPress/WooCommerce.

Objectifs :
- Migration vers Next.js pour le front (SSR, performances, SEO)
- API back-end en Node.js avec base MongoDB
- Intégration Stripe pour les paiements
- Gestion du catalogue produits (~200 références)
- Espace client (historique commandes, suivi livraison)
- Tableau de bord admin pour gérer les commandes et le stock
- Design responsive (maquettes Figma fournies)
- Connexion avec notre ERP via API REST

Le site actuel fait environ 15 000 visiteurs/mois. Nous cherchons quelqu'un de sérieux et disponible pour un projet sur 4-6 semaines.

Merci de préciser votre expérience avec Next.js et les sites e-commerce.`,
    clientName: 'Marie L.',
  },
  {
    id: '478210',
    slug: 'creation-logo-charte-graphique',
    url: '/projects/478210-creation-logo-charte-graphique',
    title: 'Création logo et charte graphique',
    budget: 'Moins de 500 €',
    offerCount: 35,
    categories: ['Graphiste', 'Designer'],
    postedAgo: 'Il y a 1 heure',
    description: `Bonjour,

Je cherche un graphiste pour créer le logo et la charte graphique de ma nouvelle entreprise de conseil en management.

Livrables attendus :
- Logo en plusieurs formats (PNG, SVG, AI)
- Charte graphique (couleurs, typographies, règles d'utilisation)
- Déclinaisons pour carte de visite et signature email

Budget : moins de 500€
Délai : 2 semaines`,
    clientName: 'Thomas B.',
  },
  {
    id: '478220',
    slug: 'api-nestjs-mongodb-gestion-reservations',
    url: '/projects/478220-api-nestjs-mongodb-gestion-reservations',
    title: 'Développement API NestJS + MongoDB pour gestion de réservations',
    budget: '1 000 € à 2 000 €',
    offerCount: 5,
    categories: ['Développeur Node.js', 'Développeur API', 'Développeur back-end'],
    postedAgo: 'Il y a 30 minutes',
    description: `Bonjour,

Je développe une application mobile de réservation de salles de sport et j'ai besoin d'un développeur back-end pour créer l'API.

Stack imposé : NestJS + MongoDB (hébergé sur MongoDB Atlas)

Fonctionnalités de l'API :
- Authentification JWT (inscription, connexion, refresh token)
- CRUD salles de sport avec géolocalisation
- Système de réservation avec créneaux horaires
- Gestion des abonnements (mensuel, annuel)
- Paiement via Stripe (webhooks inclus)
- Notifications push (Firebase)
- Panel admin (stats, gestion utilisateurs)

L'app mobile (React Native) est déjà en cours de développement côté front. La doc Swagger est un plus.

Délai souhaité : 3 semaines
Merci d'envoyer des exemples d'API similaires.`,
    clientName: 'Karim M.',
  },
];

async function runTest() {
  logger.info('========================================');
  logger.info('  TEST AI - Analyse de projets fictifs');
  logger.info(`  Modèle: ${config.openaiModel}`);
  logger.info('========================================\n');

  for (let i = 0; i < testProjects.length; i++) {
    const project = testProjects[i];
    logger.info(`\n--- Projet ${i + 1}/${testProjects.length} ---`);
    logger.info(`Titre: ${project.title}`);
    logger.info(`Budget: ${project.budget}`);
    logger.info(`Offres: ${project.offerCount}`);
    logger.info(`Catégories: ${project.categories.join(', ')}`);

    const analysis = await analyzeProject(project);

    console.log('\n📊 RÉSULTAT:');
    console.log(`   Score: ${analysis.relevanceScore}/100`);
    console.log(`   Offre: ${analysis.shouldBid ? '✅ OUI' : '❌ NON'}`);
    console.log(`   Montant: ${analysis.suggestedAmount}€`);
    console.log(`   Délai: ${analysis.suggestedDays} jours`);
    console.log(`   Raison: ${analysis.reasoning}`);
    console.log(`\n📝 PROPOSITION (${analysis.proposalText.length} chars):`);
    console.log(`   ${analysis.proposalText}`);
    console.log('\n' + '='.repeat(60));

    // Pause entre les appels API
    if (i < testProjects.length - 1) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  logger.info('\n✅ Test terminé !');
}

runTest().catch((err) => {
  logger.error('Erreur test:', { error: err });
  process.exit(1);
});
