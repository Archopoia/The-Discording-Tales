/**
 * Attribute data definitions
 * 8 Attributes (ATB) from the TTRPG system
 */

export enum Attribute {
  FOR = 'FOR',  // Force
  AGI = 'AGI',  // Agilité
  DEX = 'DEX',  // Dextérité
  VIG = 'VIG',  // Vigueur
  EMP = 'EMP',  // Empathie
  PER = 'PER',  // Perception
  CRE = 'CRE',  // Créativité
  VOL = 'VOL',  // Volonté
}

export const ATTRIBUTE_NAMES: Record<Attribute, string> = {
  [Attribute.FOR]: 'Force',
  [Attribute.AGI]: 'Agilité',
  [Attribute.DEX]: 'Dextérité',
  [Attribute.VIG]: 'Vigueur',
  [Attribute.EMP]: 'Empathie',
  [Attribute.PER]: 'Perception',
  [Attribute.CRE]: 'Créativité',
  [Attribute.VOL]: 'Volonté',
};

export const ATTRIBUTE_ABBREVIATIONS: Record<Attribute, string> = {
  [Attribute.FOR]: 'FOR',
  [Attribute.AGI]: 'AGI',
  [Attribute.DEX]: 'DEX',
  [Attribute.VIG]: 'VIG',
  [Attribute.EMP]: 'EMP',
  [Attribute.PER]: 'PER',
  [Attribute.CRE]: 'CRÉ',
  [Attribute.VOL]: 'VOL',
};

export function getAttributeName(attribute: Attribute): string {
  return ATTRIBUTE_NAMES[attribute] || 'Unknown';
}

export function getAttributeAbbreviation(attribute: Attribute): string {
  return ATTRIBUTE_ABBREVIATIONS[attribute] || '???';
}

