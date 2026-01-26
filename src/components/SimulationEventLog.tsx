'use client';

import { useState, useRef, useEffect } from 'react';
import { CharacterSheetManager } from '@/game/character/CharacterSheetManager';
import { getAttributeName } from '@/game/character/data/AttributeData';
import { getAptitudeAttributes } from '@/game/character/data/AptitudeData';
import { Competence, getCompetenceName, getCompetenceAction } from '@/game/character/data/CompetenceData';
import { getActionLinkedAttribute, getActionAptitude } from '@/game/character/data/ActionData';
import { Souffrance, getSouffranceName, getResistanceCompetenceName, getSouffranceAttribute } from '@/game/character/data/SouffranceData';
import { loadCachedCharacter, saveCachedCharacter, clearCachedCharacter } from '@/lib/simulationStorage';
import { MARKS_TO_EPROUVER } from '@/game/character/CharacterSheetManager';
import { rollCompetenceCheck, type CompetenceRollParams } from '@/game/dice/CompetenceRoll';

export type SimEventType =
  | 'challenge'
  | 'choice'
  | 'resolve'
  | 'souffrance'
  | 'resistance'
  | 'xp'
  | 'realize'
  | 'degree'
  | 'mastery'
  | 'info';

export interface SimEvent {
  type: SimEventType;
  text: string;
  step?: number;
}

export const POOL_ATTRIBUTE_POINTS = 18;
export const MIN_REVEAL = 3;
export const MAX_REVEAL = 5;
export const POOL_DICE = 10;

const CHALLENGES: { description: string; suggested?: Competence; nivEpreuve?: number }[] = [
  { description: 'Escalader le mur', suggested: Competence.GRIMPE, nivEpreuve: 2 },
  { description: 'Convaincre le garde', suggested: Competence.NEGOCIATION, nivEpreuve: 0 },
  { description: 'Fouiller la pièce', suggested: Competence.INVESTIGATION, nivEpreuve: 1 },
  { description: 'Esquiver l’attaque', suggested: Competence.ESQUIVE, nivEpreuve: 0 },
  { description: 'Réparer le mécanisme', suggested: Competence.DEBROUILLARDISE, nivEpreuve: 1 },
];

function getRollParams(
  manager: CharacterSheetManager,
  comp: Competence,
  nivEpreuve: number
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
  };
}

export type StepActionPayload =
  | { step: 'attributes' | 'reveal' | 'dice'; label: string; onClick: () => void; disabled: boolean }
  | null;

interface SimulationEventLogProps {
  manager: CharacterSheetManager;
  updateSheet: () => void;
  onHighlight?: (id: string | null, tooltip?: string) => void;
  onStepAction?: (action: StepActionPayload) => void;
  /** Pass when in creation so step-action disabled updates when user edits on sheet */
  creationStateDeps?: { attrSum: number; revealedCount: number; diceSum?: number };
  /** Called when creation finishes (after dice step); sheet can collapse actions with no revealed comp */
  onCreationComplete?: () => void;
}

export type EventColumn = 'top' | 'competences' | 'progression' | 'souffrance';

function getEventColumn(type: SimEventType): EventColumn {
  switch (type) {
    case 'challenge':
    case 'info':
      return 'top';
    case 'choice':
    case 'resolve':
      return 'competences';
    case 'xp':
    case 'realize':
    case 'degree':
    case 'mastery':
      return 'progression';
    case 'souffrance':
    case 'resistance':
      return 'souffrance';
    default:
      return 'top';
  }
}

const COLUMN_LABELS: Record<Exclude<EventColumn, 'top'>, string> = {
  competences: 'Compétences',
  progression: 'Progression',
  souffrance: 'Souffrance / Résistance',
};

function eventStyle(type: SimEventType): string {
  const base = 'font-mono text-xs py-0.5 px-1 rounded border-l-2 ';
  switch (type) {
    case 'challenge':
      return base + 'border-amber-700 bg-amber-950/30 text-amber-100';
    case 'choice':
      return base + 'border-emerald-700 bg-emerald-950/30 text-emerald-100';
    case 'resolve':
      return base + 'border-red-800 bg-red-950/40 text-red-100';
    case 'souffrance':
      return base + 'border-rose-800 bg-rose-950/30 text-rose-100';
    case 'resistance':
      return base + 'border-orange-700 bg-orange-950/30 text-orange-100';
    case 'xp':
      return base + 'border-yellow-600 bg-yellow-950/40 text-yellow-100';
    case 'realize':
      return base + 'border-cyan-600 bg-cyan-950/30 text-cyan-100';
    case 'degree':
      return base + 'border-sky-600 bg-sky-950/30 text-sky-100';
    case 'mastery':
      return base + 'border-violet-600 bg-violet-950/30 text-violet-100';
    case 'info':
    default:
      return base + 'border-border-dark bg-black/20 text-text-cream';
  }
}

const CREATE_ATTR_TOOLTIP = "Répartissez jusqu'à 18 points entre les 8 attributs (chaque case = +1).";
const CREATE_REVEAL_TOOLTIP = "Choisissez de 3 à 5 compétences à révéler en cliquant sur « Révéler … ? » sur la feuille.";
const CREATE_DICE_TOOLTIP = `Répartissez exactement ${POOL_DICE} dés dans les compétences révélées et/ou les compétences de résistance (R[…]), puis lancez.`;

export default function SimulationEventLog({
  manager,
  updateSheet,
  onHighlight,
  onStepAction,
  creationStateDeps,
  onCreationComplete,
}: SimulationEventLogProps) {
  const [events, setEvents] = useState<SimEvent[]>([]);
  const [mode, setMode] = useState<'idle' | 'creating' | 'running'>('idle');
  const [createStep, setCreateStep] = useState<'attributes' | 'reveal' | 'dice'>('attributes');
  const [awaitingSkillChoice, setAwaitingSkillChoice] = useState(false);
  const [runningChallengeIdx, setRunningChallengeIdx] = useState(0);
  const topScrollRef = useRef<HTMLDivElement | null>(null);
  const scrollColRefs = useRef<Record<string, HTMLDivElement | null>>({
    competences: null,
    progression: null,
    souffrance: null,
  });

  const push = (type: SimEventType, text: string, step?: number) => {
    setEvents((prev) => [...prev, { type, text, step: step ?? prev.length + 1 }]);
  };

  useEffect(() => {
    const scrollToBottom = (el: HTMLDivElement | null) => {
      if (el) el.scrollTop = el.scrollHeight;
    };
    const id = requestAnimationFrame(() => {
      scrollToBottom(topScrollRef.current);
      (['competences', 'progression', 'souffrance'] as const).forEach((col) => {
        scrollToBottom(scrollColRefs.current[col]);
      });
    });
    return () => cancelAnimationFrame(id);
  }, [events]);

  const confirmRevealAndGoToDice = () => {
    const revealed = Object.values(Competence).filter((c) => manager.getState().competences[c]?.isRevealed);
    if (revealed.length < MIN_REVEAL || revealed.length > MAX_REVEAL) return;
    const names = revealed.map(getCompetenceName).join(', ');
    push('info', `Compétences révélées : ${names}. Répartissez ${POOL_DICE} dés entre elles.`);
    setCreateStep('dice');
    onHighlight?.('create-dice', CREATE_DICE_TOOLTIP);
    onStepAction?.({
      step: 'dice',
      label: 'Lancer la simulation',
      onClick: confirmDiceAndStart,
      disabled: (() => {
        const diceSum = creationStateDeps?.diceSum ?? Object.values(Competence)
          .filter((c) => manager.getState().competences[c]?.isRevealed)
          .reduce((s, c) => s + (manager.getState().competences[c]?.degreeCount ?? 0), 0);
        return diceSum !== POOL_DICE;
      })(),
    });
  };

  const confirmDiceAndStart = () => {
    const state = manager.getState();
    const diceSum =
      Object.values(Competence)
        .filter((c) => state.competences[c]?.isRevealed)
        .reduce((s, c) => s + (state.competences[c]?.degreeCount ?? 0), 0) +
      Object.values(Souffrance).reduce((s, souf) => s + (state.souffrances[souf]?.resistanceDegreeCount ?? 0), 0);
    if (diceSum !== POOL_DICE) return;
    push('info', `${POOL_DICE} dés répartis. Démarrage.`);
    onCreationComplete?.();
    saveCachedCharacter(manager.getState());
    setMode('running');
    setCreateStep('attributes');
    setRunningChallengeIdx(0);
    runChallenge(0);
    onHighlight?.(null);
    onStepAction?.(null);
  };

  const validateAndGoToReveal = () => {
    push('info', 'Attributs validés.');
    setCreateStep('reveal');
    onHighlight?.('create-reveal', CREATE_REVEAL_TOOLTIP);
    onStepAction?.({
      step: 'reveal',
      label: 'Répartir les dés',
      onClick: confirmRevealAndGoToDice,
      disabled: (() => {
        const n = Object.values(Competence).filter((c) => manager.getState().competences[c]?.isRevealed).length;
        return n < MIN_REVEAL || n > MAX_REVEAL;
      })(),
    });
  };

  useEffect(() => {
    if (mode !== 'creating') {
      onStepAction?.(null);
      return;
    }
    const attrSum = creationStateDeps?.attrSum ?? Object.values(manager.getState().attributes).reduce((s, n) => s + n, 0);
    const revealedCount = creationStateDeps?.revealedCount ?? Object.values(Competence).filter((c) => manager.getState().competences[c]?.isRevealed).length;
    const state = manager.getState();
    const diceSum = creationStateDeps?.diceSum ?? (
      Object.values(Competence)
        .filter((c) => state.competences[c]?.isRevealed)
        .reduce((s, c) => s + (state.competences[c]?.degreeCount ?? 0), 0) +
      Object.values(Souffrance).reduce((s, souf) => s + (state.souffrances[souf]?.resistanceDegreeCount ?? 0), 0)
    );

    if (createStep === 'attributes') {
      onHighlight?.('create-attributes', CREATE_ATTR_TOOLTIP);
      onStepAction?.({
        step: 'attributes',
        label: 'Valider',
        onClick: validateAndGoToReveal,
        disabled: attrSum > POOL_ATTRIBUTE_POINTS,
      });
    } else if (createStep === 'reveal') {
      onHighlight?.('create-reveal', CREATE_REVEAL_TOOLTIP);
      onStepAction?.({
        step: 'reveal',
        label: 'Répartir les dés',
        onClick: confirmRevealAndGoToDice,
        disabled: revealedCount < MIN_REVEAL || revealedCount > MAX_REVEAL,
      });
    } else {
      onHighlight?.('create-dice', CREATE_DICE_TOOLTIP);
      onStepAction?.({
        step: 'dice',
        label: 'Lancer la simulation',
        onClick: confirmDiceAndStart,
        disabled: diceSum !== POOL_DICE,
      });
    }
  }, [mode, createStep, creationStateDeps?.attrSum, creationStateDeps?.revealedCount, creationStateDeps?.diceSum]);

  const startSimulation = () => {
    const cached = loadCachedCharacter();
    if (cached) {
      manager.loadState(cached);
      updateSheet();
      push('info', 'Personnage chargé depuis la session.');
      setMode('running');
      setRunningChallengeIdx(0);
      runChallenge(0);
      onStepAction?.(null);
    } else {
      setMode('creating');
      setCreateStep('attributes');
      setEvents([]);
      push('info', 'Créez votre personnage : répartissez les points sur la feuille, puis validez dans la zone mise en surbrillance.');
    }
  };

  const runChallenge = (idx: number) => {
    const c = CHALLENGES[idx % CHALLENGES.length];
    const nivStr = (c.nivEpreuve ?? 0) >= 0 ? `+${c.nivEpreuve ?? 0}` : `${c.nivEpreuve ?? 0}`;
    push('challenge', `Défi : ${c.description} — Niv d'épreuve : ${nivStr}`);
    onHighlight?.(null);
    const revealed = Object.values(Competence).filter(
      (comp) => manager.getState().competences[comp]?.isRevealed
    );
    if (revealed.length === 0) {
      push('info', 'Aucune compétence révélée — termine d’abord la création.');
      return;
    }
    setAwaitingSkillChoice(true);
    setRunningChallengeIdx(idx);
  };

  const onChooseSkill = (comp: Competence) => {
    if (!awaitingSkillChoice) return;
    setAwaitingSkillChoice(false);
    push('choice', `Compétence utilisée : ${getCompetenceName(comp)}`);
    onHighlight?.(`competence-${comp}`, 'Les marques et Réaliser se mettent à jour ici.');
    const challenge = CHALLENGES[runningChallengeIdx % CHALLENGES.length];
    const nivEpreuve = challenge?.nivEpreuve ?? 0;
    const rollParams = getRollParams(manager, comp, nivEpreuve);
    const rollResult = rollCompetenceCheck(rollParams);
    const marks = rollResult.criticalFailure ? 5 : rollResult.success || rollResult.criticalSuccess ? 0 : 1;
    for (let i = 0; i < marks; i++) manager.addCompetenceMark(comp);
    updateSheet();
    const compName = getCompetenceName(comp);
    const parts = rollResult.summary.split(/\.\s+/);
    const jetPart = parts[0] ?? rollResult.summary;
    const comparisonPart = parts[1];
    const resolveText = comparisonPart
      ? `[${compName}] ${jetPart}.\n${comparisonPart}`
      : `[${compName}] ${rollResult.summary}`;
    push('resolve', resolveText);
    push('xp', `Marques : ${manager.getTotalMarks(comp)}/${MARKS_TO_EPROUVER} — ${compName}`);
    if (manager.isCompetenceEprouvee(comp)) {
      const action = getCompetenceAction(comp);
      const linkedAttr = getActionLinkedAttribute(action);
      manager.realizeCompetence(comp);
      updateSheet();
      push('realize', `Éprouvé : ${getCompetenceName(comp)} +1 degré, marques réinitialisées.`);
      push('degree', `+1 ${getAttributeName(linkedAttr)}`);
      const mt = manager.getMasteryPoints(comp);
      if (mt > 0) push('mastery', `+${mt} MT (point(s) de maîtrise) pour ${getCompetenceName(comp)}`);
    }
    applySouffranceAndResistance();
  };

  const applySouffranceAndResistance = () => {
    const souf = Souffrance.BLESSURES;
    const ds = 2;
    manager.addSouffranceDegree(souf, ds);
    updateSheet();
    push('souffrance', `Vous subissez ${ds} DS ${getSouffranceName(souf)}.`);
    onHighlight?.(`souffrance-${souf}`, 'Les DS s’accumulent ici ; à 10+ Rage, 15+ Évanouissement.');
    const resistFail = Math.random() < 0.5;
    if (resistFail) {
      manager.addSouffranceMark(souf);
      updateSheet();
      push('resistance', `${getResistanceCompetenceName(souf)} échec → +1 Marque résistance.`);
      onHighlight?.(`resistance-${souf}`, 'La compétence de Résistance gagne des marques à l’échec.');
    }
    if (manager.isSouffranceEprouvee(souf)) {
      manager.realizeSouffrance(souf);
      updateSheet();
      push('realize', `Éprouvé : ${getResistanceCompetenceName(souf)} +1 degré de résistance.`);
    }
    onHighlight?.(null);
  };

  const nextChallenge = () => {
    const next = runningChallengeIdx + 1;
    runChallenge(next);
  };

  const resetAndNewCharacter = () => {
    clearCachedCharacter();
    const fresh = new CharacterSheetManager();
    manager.loadState(fresh.getState());
    updateSheet();
    setEvents([]);
    setMode('creating');
    setCreateStep('attributes');
    setAwaitingSkillChoice(false);
    setRunningChallengeIdx(0);
    onHighlight?.(null);
    onStepAction?.(null);
  };

  const isChoosingSkill = mode === 'running' && awaitingSkillChoice;
  const revealedList = Object.values(Competence).filter(
    (c) => manager.getState().competences[c]?.isRevealed
  );

  return (
    <div
      className="w-full rounded-lg border-2 border-border-dark mb-4 overflow-hidden font-medieval"
      style={{
        background: 'linear-gradient(180deg, rgba(40,28,18,0.95) 0%, rgba(30,22,14,0.98) 100%)',
        boxShadow: 'inset 0 0 0 1px #ceb68d, 0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-border-dark"
        style={{ background: 'rgba(100,48,48,0.4)', boxShadow: 'inset 0 0 0 1px #ceb68d' }}
      >
        <span className="text-sm font-bold text-text-cream" style={{ textShadow: '0 1px 2px #000' }}>
          Journal de simulation
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {mode === 'idle' && (
            <button
              type="button"
              onClick={startSimulation}
              className="px-3 py-1.5 bg-red-theme text-text-cream border-2 border-border-dark rounded font-semibold text-sm hover:bg-amber-800 transition-colors"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
            >
              Démarrer
            </button>
          )}
          {mode === 'running' && !isChoosingSkill && (
            <button
              type="button"
              onClick={nextChallenge}
              className="px-3 py-1.5 bg-red-theme text-text-cream border-2 border-border-dark rounded font-semibold text-sm hover:bg-amber-800"
            >
              Suivant
            </button>
          )}
          <button
            type="button"
            onClick={resetAndNewCharacter}
            className="px-3 py-1.5 bg-stone-600 text-text-cream border-2 border-border-dark rounded font-semibold text-sm hover:bg-stone-500 transition-colors"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {mode === 'running' && isChoosingSkill && (
        <div className="p-3 border-b border-border-dark bg-black/20">
          <p className="text-xs text-text-cream mb-2">Quelle compétence utiliser ?</p>
          <div className="flex flex-wrap gap-2">
            {revealedList.map((comp) => (
              <button
                key={comp}
                type="button"
                onClick={() => onChooseSkill(comp)}
                className="px-3 py-1.5 bg-emerald-800 border-2 border-emerald-600 text-text-cream rounded text-xs font-semibold hover:bg-emerald-700"
              >
                {getCompetenceName(comp)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        className="p-2 font-mono text-xs space-y-2"
        style={{ background: 'rgba(0,0,0,0.35)', minHeight: '100px' }}
      >
        {/* Ligne du haut : personnage chargé, Défi, etc. — une seule ligne, dernier événement uniquement */}
        {(() => {
          const topEvents = events
            .map((ev, i) => ({ ev, i }))
            .filter(({ ev }) => getEventColumn(ev.type) === 'top');
          const latestOnly = topEvents.length ? [topEvents[topEvents.length - 1]] : [];
          if (latestOnly.length === 0) return null;
          return (
            <div
              className="rounded border border-border-dark overflow-hidden shrink-0 flex flex-col"
              style={{ background: 'rgba(0,0,0,0.2)' }}
            >
              <div
                ref={topScrollRef}
                className="h-7 overflow-hidden flex items-center px-1.5 min-h-0"
              >
                {latestOnly.map(({ ev, i }) => (
                  <div key={i} className={`${eventStyle(ev.type)} flex items-center gap-1.5 min-w-0 w-full`} title={ev.text}>
                    <span className="text-gray-500 shrink-0">#{ev.step ?? i + 1}</span>
                    <span className="truncate min-w-0">{ev.text}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Trois colonnes : Compétences, Progression, Souffrance / Résistance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {(['competences', 'progression', 'souffrance'] as const).map((col) => {
            const colEvents = events
              .map((ev, i) => ({ ev, i }))
              .filter(({ ev }) => getEventColumn(ev.type) === col);
            return (
              <div
                key={col}
                className="flex flex-col rounded border border-border-dark overflow-hidden"
                style={{ background: 'rgba(0,0,0,0.25)', minWidth: 0 }}
              >
                <div
                  className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide shrink-0 border-b border-border-dark"
                  style={{
                    color: col === 'competences' ? '#fcd34d' : col === 'progression' ? '#67e8f9' : '#f9a8d4',
                    background: 'rgba(0,0,0,0.4)',
                  }}
                >
                  {COLUMN_LABELS[col]}
                </div>
                <div
                  ref={(el) => {
                    scrollColRefs.current[col] = el;
                  }}
                  className="max-h-32 overflow-y-auto p-1.5 space-y-1 flex-1 min-h-0"
                >
                  {colEvents.length === 0 && (
                    <div className="text-gray-500 italic text-[10px] py-1">—</div>
                  )}
                  {colEvents.map(({ ev, i }) => (
                    <div key={i} className={eventStyle(ev.type)} style={{ whiteSpace: 'pre-line' }}>
                      <span className="text-gray-500 mr-1.5">#{ev.step ?? i + 1}</span>
                      {ev.text}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
