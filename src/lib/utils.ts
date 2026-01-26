/**
 * Utility functions for character sheet and game logic
 */

/**
 * Get level name from level number
 * Maps numeric levels to French level names
 */
export function getLevelName(level: number): string {
  switch (level) {
    case 0: return 'Néophyte';
    case 1: return 'Initié';
    case 2: return 'Disciple';
    case 3: return 'Adepte';
    case 4: return 'Expert';
    case 5: return 'Maître';
    default: return `N${level}`;
  }
}

/**
 * Calculate level from degree count
 * Used for Souffrances and Compétences
 */
export function getLevelFromDegreeCount(degreeCount: number): number {
  if (degreeCount === 0) return 0;
  if (degreeCount <= 2) return 1;
  if (degreeCount <= 5) return 2;
  if (degreeCount <= 9) return 3;
  if (degreeCount <= 14) return 4;
  return 5;
}

