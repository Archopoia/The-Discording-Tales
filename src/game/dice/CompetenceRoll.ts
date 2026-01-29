/**
 * TTRPG-aligned competence roll: dD (Fate-style +1/0/-1), pool, keep-5 rule.
 * Refs: LIVRET p.3, 01_Systeme_General, 05_Souffrances (DS as negative dice).
 */

export type FateFace = -1 | 0 | 1;

const KEEP_COUNT = 5;

/** One dD: 1-2 → -1, 3-4 → 0, 5-6 → +1 (Fate-style) */
export function rollFateDie(): FateFace {
  const r = Math.floor(Math.random() * 6) + 1;
  if (r <= 2) return -1;
  if (r <= 4) return 0;
  return 1;
}

export type RollSummaryLang = 'en' | 'fr';

export interface CompetenceRollParams {
  nivAptitude: number;
  compDegrees: number;
  masteryDegrees: number;
  dsNegative: number;
  nivEpreuve: number;
  /** Language for summary/outcome text. Default 'fr'. */
  lang?: RollSummaryLang;
}

/** Format one dD face as +/0/- for display. */
export function faceToSymbol(face: number): '+' | '0' | '-' {
  if (face === 1) return '+';
  if (face === 0) return '0';
  return '-';
}

export interface CompetenceRollResult {
  result: number;
  success: boolean;
  criticalFailure: boolean;
  criticalSuccess: boolean;
  diceRolled: number[];
  diceKept: number[];
  niv: number;
  nivEpreuve: number;
  poolSize: number;
  summary: string;
  /** Full breakdown: pool formula, all dice +/0/-, kept 5, modifiers, result. */
  diceBreakdown: string;
}

/**
 * Roll a competence check: 5 base + positive (comp + mastery) + negative (DS) dice.
 * Total dice = 5 + comp + mastery + DS (all rolled). Keep 5 highest if positive >= DS, else keep 5 lowest.
 * Result = Niv + sum(kept five). Success if result >= nivEpreuve.
 */
export function rollCompetenceCheck(params: CompetenceRollParams): CompetenceRollResult {
  const { nivAptitude, compDegrees, masteryDegrees, dsNegative, nivEpreuve, lang = 'fr' } = params;
  const positiveCount = 5 + compDegrees + masteryDegrees;
  const negativeCount = Math.max(0, dsNegative);
  const poolSize = positiveCount + negativeCount;

  const diceRolled = Array.from({ length: poolSize }, () => rollFateDie());
  const keepHighest = positiveCount >= negativeCount;
  const diceKept = keepHighest
    ? [...diceRolled].sort((a, b) => b - a).slice(0, KEEP_COUNT)
    : [...diceRolled].sort((a, b) => a - b).slice(0, KEEP_COUNT);

  const sumKept = diceKept.reduce<number>((s, d) => s + d, 0);
  const result = nivAptitude + sumKept;
  const success = result >= nivEpreuve;
  const criticalFailure = diceKept.length === KEEP_COUNT && diceKept.every((d) => d === -1);
  const criticalSuccess = diceKept.length === KEEP_COUNT && diceKept.every((d) => d === 1);

  const fmt = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
  const keptStr = diceKept.map((d) => fmt(d)).join(', ');
  const isEn = lang === 'en';
  let outcome: string;
  if (criticalFailure) outcome = isEn ? 'Critical failure (+5 marks).' : 'Échec critique (+5 marques).';
  else if (criticalSuccess) outcome = isEn ? 'Critical success.' : 'Succès critique.';
  else if (success) outcome = isEn ? 'Success.' : 'Succès.';
  else outcome = isEn ? 'Failure (+1 mark).' : 'Échec (+1 marque).';
  const resultStr = fmt(result);
  const nivEpreuveStr = fmt(nivEpreuve);
  const resultLabel = isEn ? 'Result' : 'Résultat';
  const trialLabel = isEn ? 'Trial level' : "Niv d'épreuve";
  const comparison =
    success && !criticalSuccess
      ? `${resultLabel} ${resultStr} ≥ ${trialLabel} ${nivEpreuveStr} → ${outcome}`
      : !success && !criticalFailure
        ? `${resultLabel} ${resultStr} < ${trialLabel} ${nivEpreuveStr} → ${outcome}`
        : `${resultLabel} ${resultStr} vs ${trialLabel} ${nivEpreuveStr} → ${outcome}`;
  const rollLabel = isEn ? 'Roll' : 'Jet';
  const keptLabel = isEn ? 'kept' : 'gardés';
  const summary = `${rollLabel}: Niv ${fmt(nivAptitude)}, ${poolSize}dD → 5 ${keptLabel} [${keptStr}] = ${resultLabel} ${resultStr}. ${comparison}`;

  const diceRolledSymbols = diceRolled.map(faceToSymbol).join(',');
  const diceKeptSymbols = diceKept.map(faceToSymbol).join(',');
  const baseLabel = isEn ? 'base' : 'base';
  const compLabel = isEn ? 'comp' : 'comp';
  const masteryLabel = isEn ? 'mastery' : 'maîtrise';
  const poolLine = isEn
    ? `Pool: 5 ${baseLabel} + ${compDegrees} ${compLabel} + ${masteryDegrees} ${masteryLabel} − ${negativeCount} DS = ${poolSize} dD`
    : `Pool : 5 ${baseLabel} + ${compDegrees} ${compLabel} + ${masteryDegrees} ${masteryLabel} − ${negativeCount} DS = ${poolSize} dD`;
  const rolledLabel = isEn ? 'Rolled' : 'Jet';
  const sumLabel = isEn ? 'sum' : 'somme';
  const diceBreakdown =
    `${poolLine}\n` +
    `${rolledLabel}: [${diceRolledSymbols}] → 5 ${keptLabel}: [${diceKeptSymbols}] → ${sumLabel} ${fmt(sumKept)}. Niv ${fmt(nivAptitude)} + ${fmt(sumKept)} = ${resultLabel} ${resultStr}`;

  return {
    result,
    success,
    criticalFailure,
    criticalSuccess,
    diceRolled,
    diceKept,
    niv: nivAptitude,
    nivEpreuve,
    poolSize,
    summary,
    diceBreakdown,
  };
}
