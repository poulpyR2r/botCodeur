import { config } from '../config';
import { logger } from '../logger';
import type { ProjectListing } from '../types';

export function filterProjects(projects: ProjectListing[]): ProjectListing[] {
  const keywords = config.filterKeywords;

  const filtered = projects.filter((project) => {
    const searchText = [
      project.title,
      ...project.categories,
      project.budget,
    ].join(' ').toLowerCase();

    const matched = keywords.some((kw) => searchText.includes(kw));
    if (!matched) {
      logger.debug(`Filtré (hors stack): ${project.title}`);
    }
    return matched;
  });

  logger.info(`Filtre mots-clés: ${filtered.length}/${projects.length} projets retenus`);
  return filtered;
}
