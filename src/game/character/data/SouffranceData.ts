import { Attribute } from './AttributeData';

/**
 * Souffrance (Suffering) data definitions
 * 8 Souffrances, each tied to a specific Attribute
 */

export enum Souffrance {
  BLESSURES = 'BLESSURES',    // Blessures (FOR)
  FATIGUES = 'FATIGUES',      // Fatigues (AGI)
  ENTRAVES = 'ENTRAVES',      // Entraves (DEX)
  DISETTES = 'DISETTES',      // Disettes (VIG)
  ADDICTIONS = 'ADDICTIONS',  // Addictions (EMP)
  MALADIES = 'MALADIES',      // Maladies (PER)
  FOLIES = 'FOLIES',          // Folies (CRÉ)
  RANCOEURS = 'RANCOEURS',    // Rancœurs (VOL)
}

export const SOUFFRANCE_NAMES: Record<Souffrance, string> = {
  [Souffrance.BLESSURES]: 'Blessures',
  [Souffrance.FATIGUES]: 'Fatigues',
  [Souffrance.ENTRAVES]: 'Entraves',
  [Souffrance.DISETTES]: 'Disettes',
  [Souffrance.ADDICTIONS]: 'Addictions',
  [Souffrance.MALADIES]: 'Maladies',
  [Souffrance.FOLIES]: 'Folies',
  [Souffrance.RANCOEURS]: 'Rancœurs',
};

// Mapping: Each Souffrance is tied to a specific Attribute
export const SOUFFRANCE_ATTRIBUTE: Record<Souffrance, Attribute> = {
  [Souffrance.BLESSURES]: Attribute.FOR,
  [Souffrance.FATIGUES]: Attribute.AGI,
  [Souffrance.ENTRAVES]: Attribute.DEX,
  [Souffrance.DISETTES]: Attribute.VIG,
  [Souffrance.ADDICTIONS]: Attribute.EMP,
  [Souffrance.MALADIES]: Attribute.PER,
  [Souffrance.FOLIES]: Attribute.CRE,
  [Souffrance.RANCOEURS]: Attribute.VOL,
};

export function getSouffranceName(souffrance: Souffrance): string {
  return SOUFFRANCE_NAMES[souffrance] || 'Unknown';
}

/**
 * Get the resistance competence name for a souffrance
 * Each souffrance acts as its own resistance competence, named R[Blessures], R[Fatigues], etc.
 */
export function getResistanceCompetenceName(souffrance: Souffrance): string {
  return `R[${getSouffranceName(souffrance)}]`;
}

export function getSouffranceAttribute(souffrance: Souffrance): Attribute {
  return SOUFFRANCE_ATTRIBUTE[souffrance] || Attribute.FOR;
}

