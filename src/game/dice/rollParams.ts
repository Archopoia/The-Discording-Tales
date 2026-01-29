/**
 * Shared roll params builder for competence checks.
 * Used by SimulationEventLog and the Play-tab roll bridge.
 */

import type { CharacterSheetManager } from '@/game/character/CharacterSheetManager';
import { getAptitudeAttributes } from '@/game/character/data/AptitudeData';
import { getCompetenceAction } from '@/game/character/data/CompetenceData';
import { getActionAptitude } from '@/game/character/data/ActionData';
import { Souffrance, getSouffranceAttribute } from '@/game/character/data/SouffranceData';
import type { Competence } from '@/game/character/data/CompetenceData';
import type { CompetenceRollParams } from './CompetenceRoll';
import type { CharacterSheetLang } from '@/lib/characterSheetI18n';

export function getRollParams(
  manager: CharacterSheetManager,
  comp: Competence,
  nivEpreuve: number,
  lang: CharacterSheetLang
): CompetenceRollParams {
  const action = getCompetenceAction(comp);
  const aptitude = getActionAptitude(action);
  const [atb1] = getAptitudeAttributes(aptitude);
  const soufLinked = (Object.values(Souffrance) as Souffrance[]).find((s) => getSouffranceAttribute(s) === atb1);
  const dsNegative = soufLinked != null ? Math.max(0, Math.floor(manager.getSouffrance(soufLinked).degreeCount)) : 0;
  const state = manager.getState();
  const compData = state.competences[comp];
  const masteryDegrees = compData?.masteries?.reduce((s, m) => s + m.degreeCount, 0) ?? 0;
  return {
    nivAptitude: manager.getAptitudeLevel(aptitude),
    compDegrees: manager.getCompetenceDegree(comp),
    masteryDegrees,
    dsNegative,
    nivEpreuve,
    lang,
  };
}
