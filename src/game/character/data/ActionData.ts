import { Aptitude } from './AptitudeData';
import { Attribute } from './AttributeData';

/**
 * Action data definitions
 * 24 Actions from the TTRPG system (3 per Aptitude)
 */

export enum Action {
  // Puissance (3 actions)
  FRAPPER = 'FRAPPER',
  NEUTRALISER = 'NEUTRALISER',
  TIRER = 'TIRER',
  
  // Aisance (3 actions)
  REAGIR = 'REAGIR',
  DEROBER = 'DEROBER',
  COORDONNER = 'COORDONNER',
  
  // Précision (3 actions)
  MANIER = 'MANIER',
  FACONNER = 'FACONNER',
  FIGNOLER = 'FIGNOLER',
  
  // Athlétisme (3 actions)
  TRAVERSER = 'TRAVERSER',
  EFFORCER = 'EFFORCER',
  MANOEUVRER = 'MANOEUVRER',
  
  // Charisme (3 actions)
  CAPTIVER = 'CAPTIVER',
  CONVAINCRE = 'CONVAINCRE',
  INTERPRETER = 'INTERPRETER',
  
  // Détection (3 actions)
  DISCERNER = 'DISCERNER',
  DECOUVRIR = 'DECOUVRIR',
  DEPISTER = 'DEPISTER',
  
  // Réflexion (3 actions)
  CONCEVOIR = 'CONCEVOIR',
  ACCULTURER = 'ACCULTURER',
  ACCLIMATER = 'ACCLIMATER',
  
  // Domination (3 actions)
  DISCIPLINER = 'DISCIPLINER',
  ENDURER = 'ENDURER',
  DOMPTER = 'DOMPTER',
}

export const ACTION_NAMES: Record<Action, string> = {
  [Action.FRAPPER]: 'Frapper',
  [Action.NEUTRALISER]: 'Neutraliser',
  [Action.TIRER]: 'Tirer',
  [Action.REAGIR]: 'Réagir',
  [Action.DEROBER]: 'Dérober',
  [Action.COORDONNER]: 'Coordonner',
  [Action.MANIER]: 'Manier',
  [Action.FACONNER]: 'Façonner',
  [Action.FIGNOLER]: 'Fignoler',
  [Action.TRAVERSER]: 'Traverser',
  [Action.EFFORCER]: 'Efforcer',
  [Action.MANOEUVRER]: 'Manœuvrer',
  [Action.CAPTIVER]: 'Captiver',
  [Action.CONVAINCRE]: 'Convaincre',
  [Action.INTERPRETER]: 'Interpréter',
  [Action.DISCERNER]: 'Discerner',
  [Action.DECOUVRIR]: 'Découvrir',
  [Action.DEPISTER]: 'Dépister',
  [Action.CONCEVOIR]: 'Concevoir',
  [Action.ACCULTURER]: 'Acculturer',
  [Action.ACCLIMATER]: 'Acclimater',
  [Action.DISCIPLINER]: 'Discipliner',
  [Action.ENDURER]: 'Endurer',
  [Action.DOMPTER]: 'Dompter',
};

// Mapping: Each Action belongs to an Aptitude
export const ACTION_APTITUDE: Record<Action, Aptitude> = {
  [Action.FRAPPER]: Aptitude.PUISSANCE,
  [Action.NEUTRALISER]: Aptitude.PUISSANCE,
  [Action.TIRER]: Aptitude.PUISSANCE,
  [Action.REAGIR]: Aptitude.AISANCE,
  [Action.DEROBER]: Aptitude.AISANCE,
  [Action.COORDONNER]: Aptitude.AISANCE,
  [Action.MANIER]: Aptitude.PRECISION,
  [Action.FACONNER]: Aptitude.PRECISION,
  [Action.FIGNOLER]: Aptitude.PRECISION,
  [Action.TRAVERSER]: Aptitude.ATHLETISME,
  [Action.EFFORCER]: Aptitude.ATHLETISME,
  [Action.MANOEUVRER]: Aptitude.ATHLETISME,
  [Action.CAPTIVER]: Aptitude.CHARISME,
  [Action.CONVAINCRE]: Aptitude.CHARISME,
  [Action.INTERPRETER]: Aptitude.CHARISME,
  [Action.DISCERNER]: Aptitude.DETECTION,
  [Action.DECOUVRIR]: Aptitude.DETECTION,
  [Action.DEPISTER]: Aptitude.DETECTION,
  [Action.CONCEVOIR]: Aptitude.REFLEXION,
  [Action.ACCULTURER]: Aptitude.REFLEXION,
  [Action.ACCLIMATER]: Aptitude.REFLEXION,
  [Action.DISCIPLINER]: Aptitude.DOMINATION,
  [Action.ENDURER]: Aptitude.DOMINATION,
  [Action.DOMPTER]: Aptitude.DOMINATION,
};

// Mapping: Each Action is linked to one of the 3 attributes of its Aptitude
// The first action uses ATB1 (Triple), second uses ATB2 (Double), third uses ATB3 (Unique)
export const ACTION_LINKED_ATTRIBUTE: Record<Action, Attribute> = {
  // Puissance: FOR+3, AGI+2, DEX+1
  [Action.FRAPPER]: Attribute.FOR,      // Triple
  [Action.NEUTRALISER]: Attribute.AGI,   // Double
  [Action.TIRER]: Attribute.DEX,         // Unique
  
  // Aisance: AGI+3, DEX+2, VIG+1
  [Action.REAGIR]: Attribute.AGI,        // Triple
  [Action.DEROBER]: Attribute.DEX,       // Double
  [Action.COORDONNER]: Attribute.VIG,    // Unique
  
  // Précision: DEX+3, PER+2, CRE+1
  [Action.MANIER]: Attribute.DEX,        // Triple
  [Action.FACONNER]: Attribute.PER,      // Double
  [Action.FIGNOLER]: Attribute.CRE,      // Unique
  
  // Athlétisme: VIG+3, FOR+2, AGI+1
  [Action.TRAVERSER]: Attribute.VIG,     // Triple
  [Action.EFFORCER]: Attribute.FOR,      // Double
  [Action.MANOEUVRER]: Attribute.AGI,    // Unique
  
  // Charisme: EMP+3, VOL+2, PER+1
  [Action.CAPTIVER]: Attribute.EMP,       // Triple
  [Action.CONVAINCRE]: Attribute.VOL,    // Double
  [Action.INTERPRETER]: Attribute.PER,   // Unique
  
  // Détection: PER+3, CRE+2, EMP+1
  [Action.DISCERNER]: Attribute.PER,     // Triple
  [Action.DECOUVRIR]: Attribute.CRE,    // Double
  [Action.DEPISTER]: Attribute.EMP,      // Unique
  
  // Réflexion: CRE+3, EMP+2, VOL+1
  [Action.CONCEVOIR]: Attribute.CRE,    // Triple
  [Action.ACCULTURER]: Attribute.EMP,    // Double
  [Action.ACCLIMATER]: Attribute.VOL,    // Unique
  
  // Domination: VOL+3, VIG+2, FOR+1
  [Action.DISCIPLINER]: Attribute.VOL,   // Triple
  [Action.ENDURER]: Attribute.VIG,       // Double
  [Action.DOMPTER]: Attribute.FOR,        // Unique
};

export function getActionName(action: Action): string {
  return ACTION_NAMES[action] || 'Unknown';
}

export function getActionAptitude(action: Action): Aptitude {
  return ACTION_APTITUDE[action] || Aptitude.PUISSANCE;
}

export function getActionLinkedAttribute(action: Action): Attribute {
  return ACTION_LINKED_ATTRIBUTE[action] || Attribute.FOR;
}

