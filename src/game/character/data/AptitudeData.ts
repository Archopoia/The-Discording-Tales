import { Attribute } from './AttributeData';

/**
 * Aptitude data definitions
 * 8 Aptitudes (APT) from the TTRPG system
 */

export enum Aptitude {
  PUISSANCE = 'PUISSANCE',    // 1. Puissance (Fin d'Été)
  AISANCE = 'AISANCE',        // 2. Aisance (Début d'Automne)
  PRECISION = 'PRECISION',    // 3. Précision (Fin d'Automne)
  ATHLETISME = 'ATHLETISME',  // 4. Athlétisme (Début d'Hiver)
  CHARISME = 'CHARISME',      // 5. Charisme (Fin d'Hiver)
  DETECTION = 'DETECTION',    // 6. Détection (Début de Cycle)
  REFLEXION = 'REFLEXION',    // 7. Réflexion (Fin de Cycle)
  DOMINATION = 'DOMINATION',  // 8. Domination (Début d'Été)
}

export const APTITUDE_NAMES: Record<Aptitude, string> = {
  [Aptitude.PUISSANCE]: 'Puissance',
  [Aptitude.AISANCE]: 'Aisance',
  [Aptitude.PRECISION]: 'Précision',
  [Aptitude.ATHLETISME]: 'Athlétisme',
  [Aptitude.CHARISME]: 'Charisme',
  [Aptitude.DETECTION]: 'Détection',
  [Aptitude.REFLEXION]: 'Réflexion',
  [Aptitude.DOMINATION]: 'Domination',
};

// Mapping: Each Aptitude is calculated from 3 Attributes with weights
// Format: [ATB1 (weight +3), ATB2 (weight +2), ATB3 (weight +1)]
export const APTITUDE_ATTRIBUTES: Record<Aptitude, [Attribute, Attribute, Attribute]> = {
  [Aptitude.PUISSANCE]: [Attribute.FOR, Attribute.AGI, Attribute.DEX],
  [Aptitude.AISANCE]: [Attribute.AGI, Attribute.DEX, Attribute.VIG],
  [Aptitude.PRECISION]: [Attribute.DEX, Attribute.PER, Attribute.CRE],
  [Aptitude.ATHLETISME]: [Attribute.VIG, Attribute.FOR, Attribute.AGI],
  [Aptitude.CHARISME]: [Attribute.EMP, Attribute.VOL, Attribute.PER],
  [Aptitude.DETECTION]: [Attribute.PER, Attribute.CRE, Attribute.EMP],
  [Aptitude.REFLEXION]: [Attribute.CRE, Attribute.EMP, Attribute.VOL],
  [Aptitude.DOMINATION]: [Attribute.VOL, Attribute.VIG, Attribute.FOR],
};

export function getAptitudeName(aptitude: Aptitude): string {
  return APTITUDE_NAMES[aptitude] || 'Unknown';
}

export function getAptitudeAttributes(aptitude: Aptitude): [Attribute, Attribute, Attribute] {
  return APTITUDE_ATTRIBUTES[aptitude] || [Attribute.FOR, Attribute.AGI, Attribute.DEX];
}

