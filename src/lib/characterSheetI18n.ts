/**
 * Character sheet internationalization (EN/FR).
 * Uses page language from document.documentElement.lang or localStorage 'tdt-lang'.
 */

import { useState, useEffect } from 'react';
import type { Attribute } from '@/game/character/data/AttributeData';
import type { Aptitude } from '@/game/character/data/AptitudeData';
import type { Action } from '@/game/character/data/ActionData';
import type { Competence } from '@/game/character/data/CompetenceData';
import type { Souffrance } from '@/game/character/data/SouffranceData';
import { Attribute as AttrEnum } from '@/game/character/data/AttributeData';
import { Aptitude as AptEnum } from '@/game/character/data/AptitudeData';
import { Action as ActEnum } from '@/game/character/data/ActionData';
import { Competence as CompEnum } from '@/game/character/data/CompetenceData';
import { Souffrance as SoufEnum } from '@/game/character/data/SouffranceData';

export type CharacterSheetLang = 'en' | 'fr';

export function getCharacterSheetLang(): CharacterSheetLang {
  if (typeof document === 'undefined') return 'en';
  const html = document.documentElement.getAttribute('lang');
  if (html === 'en' || html === 'fr') return html;
  try {
    const stored = localStorage.getItem('tdt-lang');
    if (stored === 'en' || stored === 'fr') return stored;
  } catch (_) {}
  return 'en';
}

/** Hook that returns current lang and re-renders when the main site changes language. */
export function useCharacterSheetLang(): CharacterSheetLang {
  const [lang, setLang] = useState<CharacterSheetLang>(getCharacterSheetLang);
  useEffect(() => {
    const handler = () => setLang(getCharacterSheetLang());
    window.addEventListener('tdt-lang-changed', handler);
    return () => window.removeEventListener('tdt-lang-changed', handler);
  }, []);
  return lang;
}

// ─── UI strings ─────────────────────────────────────────────────────────────
const UI = {
  fr: {
    sheetTitle: 'Feuille de Personnage',
    close: 'Fermer',
    total: 'Total',
    totalPoints: (sum: number, max: number) => `Total : ${sum} / ${max} points`,
    competencesRevealed: (n: number, max: number, min: number) => `Compétences révélées : ${n} / ${max} (min ${min})`,
    diceDistributed: (n: number, total: number) => `Dés répartis : ${n} / ${total}`,
    resetThisStep: 'Réinitialiser cette étape',
    learnMastery: 'Apprendre Maîtrise',
    allKnown: 'Toutes connues',
    revealQuestion: (name: string) => `Révéler ${name} ?`,
    noMasteryAvailable: 'Aucune maîtrise disponible',
    allMasteriesUnlocked: 'Toutes les maîtrises sont débloquées',
    noMastery: 'Aucune maîtrise',
    masteryUpgrade: 'Upgrade (+1 point)',
    maxCompetencesRevealed: (max: number) => `Maximum ${max} compétences révélées`,
    realize: 'RÉALISER',
    // SimulationEventLog
    simLogTitle: 'Journal de simulation',
    start: 'Démarrer',
    next: 'Suivant',
    reset: 'Réinitialiser',
    whichCompetence: 'Quelle compétence utiliser ?',
    columnCompetences: 'Compétences',
    columnProgression: 'Progression',
    columnSouffrance: 'Souffrance / Résistance',
    createAttrTooltip: "Répartissez jusqu'à 18 points entre les 8 attributs (chaque case = +1).",
    createRevealTooltip: 'Choisissez de 3 à 5 compétences à révéler en cliquant sur « Révéler … ? » sur la feuille.',
    createDiceTooltip: (n: number) => `Répartissez exactement ${n} dés dans les compétences révélées et/ou les compétences de résistance (R[…]), puis lancez.`,
    validate: 'Valider',
    distributeDice: 'Répartir les dés',
    launchSimulation: 'Lancer la simulation',
    attributesValidated: 'Attributs validés.',
    revealedListRepartir: (names: string, n: number) => `Compétences révélées : ${names}. Répartissez ${n} dés entre elles.`,
    diceRepartisStart: (n: number) => `${n} dés répartis. Démarrage.`,
    characterLoaded: 'Personnage chargé depuis la session.',
    createCharacterIntro: 'Créez votre personnage : répartissez les points sur la feuille, puis validez dans la zone mise en surbrillance.',
    challengeLine: (desc: string, niv: string) => `Défi : ${desc} — Niv d'épreuve : ${niv}`,
    noCompetenceRevealed: "Aucune compétence révélée — termine d'abord la création.",
    competenceUsed: (name: string) => `Compétence utilisée : ${name}`,
    marksTooltip: 'Les marques et Réaliser se mettent à jour ici.',
    marksLine: (current: number, max: number, name: string) => `Marques : ${current}/${max} — ${name}`,
    eprouveDegree: (name: string) => `Éprouvé : ${name} +1 degré, marques réinitialisées.`,
    degreeAttr: (name: string) => `+1 ${name}`,
    masteryPoints: (mt: number, name: string) => `+${mt} MT (point(s) de maîtrise) pour ${name}`,
    youSuffer: (ds: number, name: string) => `Vous subissez ${ds} DS ${name}.`,
    dsAccumulate: "Les DS s'accumulent ici ; à 10+ Rage, 15+ Évanouissement.",
    resistanceFail: (name: string) => `${name} échec → +1 Marque résistance.`,
    resistanceMarks: "La compétence de Résistance gagne des marques à l'échec.",
    eprouveResistance: (name: string) => `Éprouvé : ${name} +1 degré de résistance.`,
    // Challenges (for sim)
    challengeClimb: 'Escalader le mur',
    challengeConvince: 'Convaincre le garde',
    challengeSearch: 'Fouiller la pièce',
    challengeDodge: "Esquiver l'attaque",
    challengeRepair: 'Réparer le mécanisme',
  },
  en: {
    sheetTitle: 'Character Sheet',
    close: 'Close',
    total: 'Total',
    totalPoints: (sum: number, max: number) => `Total: ${sum} / ${max} points`,
    competencesRevealed: (n: number, max: number, min: number) => `Revealed skills: ${n} / ${max} (min ${min})`,
    diceDistributed: (n: number, total: number) => `Dice distributed: ${n} / ${total}`,
    resetThisStep: 'Reset this step',
    learnMastery: 'Learn Mastery',
    allKnown: 'All known',
    revealQuestion: (name: string) => `Reveal ${name}?`,
    noMasteryAvailable: 'No mastery available',
    allMasteriesUnlocked: 'All masteries unlocked',
    noMastery: 'No mastery',
    masteryUpgrade: 'Upgrade (+1 point)',
    maxCompetencesRevealed: (max: number) => `Maximum ${max} skills revealed`,
    realize: 'REALIZE',
    simLogTitle: 'Simulation log',
    start: 'Start',
    next: 'Next',
    reset: 'Reset',
    whichCompetence: 'Which skill to use?',
    columnCompetences: 'Skills',
    columnProgression: 'Progression',
    columnSouffrance: 'Suffering / Resistance',
    createAttrTooltip: 'Distribute up to 18 points among the 8 attributes (each box = +1).',
    createRevealTooltip: 'Choose 3 to 5 skills to reveal by clicking "Reveal …?" on the sheet.',
    createDiceTooltip: (n: number) => `Distribute exactly ${n} dice among revealed skills and/or resistance skills (R[…]), then roll.`,
    validate: 'Validate',
    distributeDice: 'Distribute dice',
    launchSimulation: 'Launch simulation',
    attributesValidated: 'Attributes validated.',
    revealedListRepartir: (names: string, n: number) => `Revealed skills: ${names}. Distribute ${n} dice among them.`,
    diceRepartisStart: (n: number) => `${n} dice distributed. Starting.`,
    characterLoaded: 'Character loaded from session.',
    createCharacterIntro: 'Create your character: distribute points on the sheet, then validate in the highlighted area.',
    challengeLine: (desc: string, niv: string) => `Challenge: ${desc} — Trial level: ${niv}`,
    noCompetenceRevealed: 'No skill revealed — finish creation first.',
    competenceUsed: (name: string) => `Skill used: ${name}`,
    marksTooltip: 'Marks and Realize update here.',
    marksLine: (current: number, max: number, name: string) => `Marks: ${current}/${max} — ${name}`,
    eprouveDegree: (name: string) => `Tested: ${name} +1 degree, marks reset.`,
    degreeAttr: (name: string) => `+1 ${name}`,
    masteryPoints: (mt: number, name: string) => `+${mt} MT (mastery point(s)) for ${name}`,
    youSuffer: (ds: number, name: string) => `You suffer ${ds} DS ${name}.`,
    dsAccumulate: 'DS accumulate here; at 10+ Rage, 15+ Unconsciousness.',
    resistanceFail: (name: string) => `${name} failure → +1 Resistance mark.`,
    resistanceMarks: 'Resistance skill gains marks on failure.',
    eprouveResistance: (name: string) => `Tested: ${name} +1 resistance degree.`,
    challengeClimb: 'Climb the wall',
    challengeConvince: 'Convince the guard',
    challengeSearch: 'Search the room',
    challengeDodge: 'Dodge the attack',
    challengeRepair: 'Repair the mechanism',
  },
} as const;

export type UIKey = keyof typeof UI.fr;

/** Get UI string. For parameterized strings pass lang and then the args, e.g. t('totalPoints', lang, sum, max). */
export function t(key: UIKey, lang?: CharacterSheetLang, ...args: unknown[]): string {
  const l = lang ?? getCharacterSheetLang();
  const val = UI[l][key];
  if (typeof val === 'function') return (val as (...a: unknown[]) => string)(...args);
  return val as string;
}

/** Shorthand when you already have lang: tParam('totalPoints', lang, sum, max). */
export function tParam<K extends UIKey>(
  key: K,
  lang: CharacterSheetLang,
  ...args: unknown[]
): string {
  return t(key, lang, ...args);
}

// ─── Data names (EN) ────────────────────────────────────────────────────────
const ATTRIBUTE_NAMES_EN: Record<Attribute, string> = {
  [AttrEnum.FOR]: 'Strength',
  [AttrEnum.AGI]: 'Agility',
  [AttrEnum.DEX]: 'Dexterity',
  [AttrEnum.VIG]: 'Vigor',
  [AttrEnum.EMP]: 'Empathy',
  [AttrEnum.PER]: 'Perception',
  [AttrEnum.CRE]: 'Creativity',
  [AttrEnum.VOL]: 'Willpower',
};

const ATTRIBUTE_ABBREV_EN: Record<Attribute, string> = {
  [AttrEnum.FOR]: 'FOR',
  [AttrEnum.AGI]: 'AGI',
  [AttrEnum.DEX]: 'DEX',
  [AttrEnum.VIG]: 'VIG',
  [AttrEnum.EMP]: 'EMP',
  [AttrEnum.PER]: 'PER',
  [AttrEnum.CRE]: 'CRE',
  [AttrEnum.VOL]: 'VOL',
};

const APTITUDE_NAMES_EN: Record<Aptitude, string> = {
  [AptEnum.PUISSANCE]: 'Power',
  [AptEnum.AISANCE]: 'Ease',
  [AptEnum.PRECISION]: 'Precision',
  [AptEnum.ATHLETISME]: 'Athletics',
  [AptEnum.CHARISME]: 'Charisma',
  [AptEnum.DETECTION]: 'Detection',
  [AptEnum.REFLEXION]: 'Reflection',
  [AptEnum.DOMINATION]: 'Domination',
};

const ACTION_NAMES_EN: Record<Action, string> = {
  [ActEnum.FRAPPER]: 'Strike',
  [ActEnum.NEUTRALISER]: 'Neutralize',
  [ActEnum.TIRER]: 'Shoot',
  [ActEnum.REAGIR]: 'React',
  [ActEnum.DEROBER]: 'Steal',
  [ActEnum.COORDONNER]: 'Coordinate',
  [ActEnum.MANIER]: 'Wield',
  [ActEnum.FACONNER]: 'Shape',
  [ActEnum.FIGNOLER]: 'Finesse',
  [ActEnum.TRAVERSER]: 'Traverse',
  [ActEnum.EFFORCER]: 'Exert',
  [ActEnum.MANOEUVRER]: 'Maneuver',
  [ActEnum.CAPTIVER]: 'Captivate',
  [ActEnum.CONVAINCRE]: 'Convince',
  [ActEnum.INTERPRETER]: 'Interpret',
  [ActEnum.DISCERNER]: 'Discern',
  [ActEnum.DECOUVRIR]: 'Discover',
  [ActEnum.DEPISTER]: 'Track',
  [ActEnum.CONCEVOIR]: 'Conceive',
  [ActEnum.ACCULTURER]: 'Acculturate',
  [ActEnum.ACCLIMATER]: 'Acclimatize',
  [ActEnum.DISCIPLINER]: 'Discipline',
  [ActEnum.ENDURER]: 'Endure',
  [ActEnum.DOMPTER]: 'Tame',
};

const COMPETENCE_NAMES_EN: Record<Competence, string> = {
  [CompEnum.ARME]: '[Armed]',
  [CompEnum.DESARME]: '[Unarmed]',
  [CompEnum.IMPROVISE]: '[Improvised]',
  [CompEnum.LUTTE]: '[Wrestling]',
  [CompEnum.BOTTES]: '[Kicks]',
  [CompEnum.RUSES]: '[Tricks]',
  [CompEnum.BANDE]: '[Bow]',
  [CompEnum.PROPULSE]: '[Thrown]',
  [CompEnum.JETE]: '[Hurled]',
  [CompEnum.FLUIDITE]: '[Fluidity]',
  [CompEnum.ESQUIVE]: '[Dodge]',
  [CompEnum.EVASION]: '[Evasion]',
  [CompEnum.ESCAMOTAGE]: '[Sleight]',
  [CompEnum.ILLUSIONS]: '[Illusions]',
  [CompEnum.DISSIMULATION]: '[Concealment]',
  [CompEnum.GESTUELLE]: '[Gesture]',
  [CompEnum.MINUTIE]: '[Care]',
  [CompEnum.EQUILIBRE]: '[Balance]',
  [CompEnum.VISEE]: '[Aim]',
  [CompEnum.CONDUITE]: '[Driving]',
  [CompEnum.HABILETE]: '[Skill]',
  [CompEnum.DEBROUILLARDISE]: '[Resourcefulness]',
  [CompEnum.BRICOLAGE]: '[Tinkering]',
  [CompEnum.SAVOIR_FAIRE]: '[Craft]',
  [CompEnum.ARTIFICES]: '[Gadgets]',
  [CompEnum.SECURITE]: '[Security]',
  [CompEnum.CASSE_TETES]: '[Puzzles]',
  [CompEnum.PAS]: '[Step]',
  [CompEnum.GRIMPE]: '[Climbing]',
  [CompEnum.ACROBATIE]: '[Acrobatics]',
  [CompEnum.POID]: '[Weight]',
  [CompEnum.SAUT]: '[Jump]',
  [CompEnum.NATATION]: '[Swimming]',
  [CompEnum.VOL]: '[Flight]',
  [CompEnum.FOUISSAGE]: '[Burrowing]',
  [CompEnum.CHEVAUCHEMENT]: '[Mount]',
  [CompEnum.SEDUCTION]: '[Seduction]',
  [CompEnum.MIMETISME]: '[Mimicry]',
  [CompEnum.CHANT]: '[Song]',
  [CompEnum.NEGOCIATION]: '[Negotiation]',
  [CompEnum.TROMPERIE]: '[Deception]',
  [CompEnum.PRESENTATION]: '[Presentation]',
  [CompEnum.INSTRUMENTAL]: '[Instrumental]',
  [CompEnum.INSPIRATION]: '[Inspiration]',
  [CompEnum.NARRATION]: '[Narration]',
  [CompEnum.VISION]: '[Vision]',
  [CompEnum.ESTIMATION]: '[Estimation]',
  [CompEnum.TOUCHER]: '[Touch]',
  [CompEnum.INVESTIGATION]: '[Investigation]',
  [CompEnum.GOUT]: '[Taste]',
  [CompEnum.RESSENTI]: '[Feeling]',
  [CompEnum.ODORAT]: '[Smell]',
  [CompEnum.AUDITION]: '[Hearing]',
  [CompEnum.INTEROCEPTION]: '[Interoception]',
  [CompEnum.ARTISANAT]: '[Craftsmanship]',
  [CompEnum.MEDECINE]: '[Medicine]',
  [CompEnum.INGENIERIE]: '[Engineering]',
  [CompEnum.JEUX]: '[Games]',
  [CompEnum.SOCIETE]: '[Society]',
  [CompEnum.GEOGRAPHIE]: '[Geography]',
  [CompEnum.NATURE]: '[Nature]',
  [CompEnum.PASTORALISME]: '[Pastoralism]',
  [CompEnum.AGRONOMIE]: '[Agronomy]',
  [CompEnum.COMMANDEMENT]: '[Command]',
  [CompEnum.OBEISSANCE]: '[Obedience]',
  [CompEnum.OBSTINANCE]: '[Obstinacy]',
  [CompEnum.GLOUTONNERIE]: '[Gluttony]',
  [CompEnum.BEUVERIE]: '[Drinking]',
  [CompEnum.ENTRAILLES]: '[Guts]',
  [CompEnum.INTIMIDATION]: '[Intimidation]',
  [CompEnum.APPRIVOISEMENT]: '[Taming]',
  [CompEnum.DRESSAGE]: '[Training]',
};

const SOUFFRANCE_NAMES_EN: Record<Souffrance, string> = {
  [SoufEnum.BLESSURES]: 'Wounds',
  [SoufEnum.FATIGUES]: 'Fatigue',
  [SoufEnum.ENTRAVES]: 'Hindrances',
  [SoufEnum.DISETTES]: 'Deprivation',
  [SoufEnum.ADDICTIONS]: 'Addictions',
  [SoufEnum.MALADIES]: 'Diseases',
  [SoufEnum.FOLIES]: 'Madness',
  [SoufEnum.RANCOEURS]: 'Resentments',
};

const LEVEL_NAMES_EN: Record<number, string> = {
  0: 'Neophyte',
  1: 'Initiate',
  2: 'Disciple',
  3: 'Adept',
  4: 'Expert',
  5: 'Master',
};

// Re-export getters that take lang and optionally delegate to existing data
import { getAttributeName as getAttrFr, getAttributeAbbreviation as getAttrAbbrFr } from '@/game/character/data/AttributeData';
import { getAptitudeName as getAptFr } from '@/game/character/data/AptitudeData';
import { getActionName as getActFr } from '@/game/character/data/ActionData';
import { getCompetenceName as getCompFr } from '@/game/character/data/CompetenceData';
import { getSouffranceName as getSoufFr } from '@/game/character/data/SouffranceData';

export function getAttributeName(attr: Attribute, lang?: CharacterSheetLang): string {
  const l = lang ?? getCharacterSheetLang();
  return l === 'en' ? (ATTRIBUTE_NAMES_EN[attr] ?? 'Unknown') : getAttrFr(attr);
}

export function getAttributeAbbreviation(attr: Attribute, lang?: CharacterSheetLang): string {
  const l = lang ?? getCharacterSheetLang();
  return l === 'en' ? (ATTRIBUTE_ABBREV_EN[attr] ?? '???') : getAttrAbbrFr(attr);
}

export function getAptitudeName(apt: Aptitude, lang?: CharacterSheetLang): string {
  const l = lang ?? getCharacterSheetLang();
  return l === 'en' ? (APTITUDE_NAMES_EN[apt] ?? 'Unknown') : getAptFr(apt);
}

export function getActionName(action: Action, lang?: CharacterSheetLang): string {
  const l = lang ?? getCharacterSheetLang();
  return l === 'en' ? (ACTION_NAMES_EN[action] ?? 'Unknown') : getActFr(action);
}

export function getCompetenceName(comp: Competence, lang?: CharacterSheetLang): string {
  const l = lang ?? getCharacterSheetLang();
  return l === 'en' ? (COMPETENCE_NAMES_EN[comp] ?? 'Unknown') : getCompFr(comp);
}

export function getSouffranceName(souf: Souffrance, lang?: CharacterSheetLang): string {
  const l = lang ?? getCharacterSheetLang();
  return l === 'en' ? (SOUFFRANCE_NAMES_EN[souf] ?? 'Unknown') : getSoufFr(souf);
}

export function getResistanceCompetenceName(souf: Souffrance, lang?: CharacterSheetLang): string {
  const name = getSouffranceName(souf, lang);
  return `R[${name}]`;
}

export function getLevelName(level: number, lang?: CharacterSheetLang): string {
  const l = lang ?? getCharacterSheetLang();
  if (l === 'en') return LEVEL_NAMES_EN[level] ?? `N${level}`;
  const levelNamesFr: Record<number, string> = {
    0: 'Néophyte',
    1: 'Initié',
    2: 'Disciple',
    3: 'Adepte',
    4: 'Expert',
    5: 'Maître',
  };
  return levelNamesFr[level] ?? `N${level}`;
}
