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

export interface CompetenceRollParams {
  nivAptitude: number;
  compDegrees: number;
  masteryDegrees: number;
  dsNegative: number;
  nivEpreuve: number;
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
}

/**
 * Roll a competence check: 5 base + comp + mastery - DS, keep 5 (highest if pool>5, lowest if pool<=5).
 * Result = Niv + sum(kept five). Success if result >= nivEpreuve.
 */
export function rollCompetenceCheck(params: CompetenceRollParams): CompetenceRollResult {
  const { nivAptitude, compDegrees, masteryDegrees, dsNegative, nivEpreuve } = params;
  const positiveDice = 5 + compDegrees + masteryDegrees;
  const poolSize = Math.max(1, positiveDice - Math.max(0, dsNegative));

  let diceRolled: number[];
  let diceKept: number[];

  if (poolSize > KEEP_COUNT) {
    diceRolled = Array.from({ length: poolSize }, () => rollFateDie());
    diceKept = [...diceRolled]
      .sort((a, b) => b - a)
      .slice(0, KEEP_COUNT);
  } else {
    diceRolled = Array.from({ length: KEEP_COUNT }, () => rollFateDie());
    diceKept = [...diceRolled].sort((a, b) => a - b);
  }

  const sumKept = diceKept.reduce((s, d) => s + d, 0);
  const result = nivAptitude + sumKept;
  const success = result >= nivEpreuve;
  const criticalFailure = diceKept.length === KEEP_COUNT && diceKept.every((d) => d === -1);
  const criticalSuccess = diceKept.length === KEEP_COUNT && diceKept.every((d) => d === 1);

  const keptStr = diceKept.map((d) => (d >= 0 ? `+${d}` : `${d}`)).join(',');
  let outcome: string;
  if (criticalFailure) outcome = 'Échec critique (+5 marques).';
  else if (criticalSuccess) outcome = 'Succès critique.';
  else if (success) outcome = 'Succès.';
  else outcome = 'Échec (+1 marque).';
  const summary = `Jet : Niv ${nivAptitude >= 0 ? '+' : ''}${nivAptitude}, ${poolSize}dD → 5 gardés [${keptStr}] = ${result >= 0 ? '+' : ''}${result}. Épreuve ${nivEpreuve >= 0 ? '+' : ''}${nivEpreuve} → ${outcome}`;

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
  };
}
