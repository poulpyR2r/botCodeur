export interface ProjectListing {
  id: string;
  slug: string;
  url: string;
  title: string;
  budget: string;
  offerCount: number;
  categories: string[];
  postedAgo: string;
}

export interface ProjectDetail extends ProjectListing {
  description: string;
  clientName: string | null;
}

export interface AIAnalysis {
  relevanceScore: number;
  shouldBid: boolean;
  proposalText: string;
  suggestedAmount: number;
  suggestedDays: number;
  reasoning: string;
}

export interface TrackedProject {
  id: string;
  title: string;
  url: string;
  processedAt: string;
  relevanceScore: number;
  bidSubmitted: boolean;
  bidAmount: number | null;
  bidDays: number | null;
  proposalText: string | null;
}
