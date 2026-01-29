'use client';

import { useState, useEffect } from 'react';
import { CharacterSheetManager } from '@/game/character/CharacterSheetManager';
import { Competence } from '@/game/character/data/CompetenceData';
import { Souffrance } from '@/game/character/data/SouffranceData';
import { loadCachedCharacter, saveCachedCharacter, loadCharacterInfo, saveCharacterInfo } from '@/lib/simulationStorage';
import type { CharacterSheetLang } from '@/lib/characterSheetI18n';
import { t, tParam } from '@/lib/characterSheetI18n';

export const POOL_ATTRIBUTE_POINTS = 18;
export const MIN_REVEAL = 3;
export const MAX_REVEAL = 5;
export const POOL_DICE = 10;

export type CreateStepType = 'origin' | 'peuple' | 'name' | 'attributes' | 'reveal' | 'dice';

export type StepActionPayload =
  | { step: 'attributes' | 'reveal' | 'dice'; label: string; onClick: () => void; disabled: boolean }
  | null;

const ORIGINS = ['Yômmes', 'Yôrres', 'Bêstres'] as const;
const PEUPLES_BY_ORIGIN: Record<string, readonly string[]> = {
  Yômmes: ['Aristois', 'Griscribes', 'Navillis', 'Méridiens'],
  Yôrres: ['Hauts Ylfes', 'Ylfes pâles', 'Ylfes des lacs', 'Iqqars'],
  Bêstres: ['Slaadéens', 'Tchalkchaïs'],
};

interface SimulationEventLogProps {
  lang: CharacterSheetLang;
  manager: CharacterSheetManager;
  updateSheet: () => void;
  onHighlight?: (id: string | null, tooltip?: string) => void;
  onStepAction?: (action: StepActionPayload) => void;
  creationStateDeps?: { attrSum: number; revealedCount: number; diceSum?: number };
  onCreationComplete?: () => void;
}

export default function SimulationEventLog({
  lang,
  manager,
  updateSheet,
  onHighlight,
  onStepAction,
  creationStateDeps,
  onCreationComplete,
}: SimulationEventLogProps) {
  const [mode, setMode] = useState<'idle' | 'creating' | 'running'>('idle');
  const [createStep, setCreateStep] = useState<CreateStepType>('origin');
  const [narrativeOrigin, setNarrativeOrigin] = useState('');
  const [narrativePeuple, setNarrativePeuple] = useState('');
  const [narrativeName, setNarrativeName] = useState('');

  // When the user selects an option in the chat (origin, peuple, name), update narrative state and storage
  useEffect(() => {
    const handler = (ev: Event) => {
      const e = ev as CustomEvent<{ field: string; value: string }>;
      const field = e.detail?.field;
      const value = e.detail?.value ?? '';
      if (field === 'origin') {
        setNarrativeOrigin(value);
        saveCharacterInfo({ ...loadCharacterInfo(), origin: value });
      } else if (field === 'peuple') {
        setNarrativePeuple(value);
        saveCharacterInfo({ ...loadCharacterInfo(), peuple: value });
      } else if (field === 'name') {
        setNarrativeName(value);
        saveCharacterInfo({ ...loadCharacterInfo(), name: value });
      }
    };
    window.addEventListener('drd-narrative-from-chat', handler);
    return () => window.removeEventListener('drd-narrative-from-chat', handler);
  }, []);

  // When chat "Kill and create new" is clicked: reset creation state so sheet shows empty / origin step
  useEffect(() => {
    const handler = () => {
      setMode('creating');
      setCreateStep('origin');
      setNarrativeOrigin('');
      setNarrativePeuple('');
      setNarrativeName('');
      onHighlight?.(null);
      onStepAction?.(null);
    };
    window.addEventListener('drd-clear-character', handler);
    return () => window.removeEventListener('drd-clear-character', handler);
  }, [onHighlight, onStepAction]);

  // When creation is started from the Play-tab chat ("Create a character"), sync: load cached state. If narrative already in storage, skip to attributes.
  useEffect(() => {
    const handler = () => {
      const cached = loadCachedCharacter();
      if (cached) {
        manager.loadState(cached);
        updateSheet();
        setMode('creating');
        const info = loadCharacterInfo();
        if (info) {
          setNarrativeOrigin(info.origin ?? '');
          setNarrativePeuple(info.peuple ?? '');
          setNarrativeName(info.name ?? '');
        } else {
          setNarrativeOrigin('');
          setNarrativePeuple('');
          setNarrativeName('');
        }
        if (info?.origin) {
          setCreateStep('attributes');
        } else {
          setCreateStep('origin');
          onHighlight?.(null);
          onStepAction?.(null);
        }
        if (!info?.origin) {
          onHighlight?.(null);
          onStepAction?.(null);
        }
      }
    };
    window.addEventListener('drd-creation-started', handler);
    return () => window.removeEventListener('drd-creation-started', handler);
  }, [manager, updateSheet, onHighlight, onStepAction]);

  const confirmDiceAndStart = () => {
    const state = manager.getState();
    const diceSum =
      Object.values(Competence)
        .filter((c) => state.competences[c]?.isRevealed)
        .reduce((s, c) => s + (state.competences[c]?.degreeCount ?? 0), 0) +
      Object.values(Souffrance).reduce((s, souf) => s + (state.souffrances[souf]?.resistanceDegreeCount ?? 0), 0);
    if (diceSum !== POOL_DICE) return;
    try {
      const degrees: Record<string, number> = {};
      Object.values(Competence).forEach((c) => {
        const comp = state.competences[c];
        if (comp?.isRevealed && (comp.degreeCount ?? 0) > 0) {
          degrees[c as string] = comp.degreeCount;
        }
      });
      const payload = { degrees };
      window.dispatchEvent(new CustomEvent('drd-creation-step-from-sheet', { detail: { step: 'dice', payload } }));
    } catch {
      // ignore
    }
    onCreationComplete?.();
    saveCachedCharacter(manager.getState());
    try {
      window.dispatchEvent(new CustomEvent('drd-character-created'));
    } catch {
      // ignore
    }
    setMode('running');
    setCreateStep('attributes');
    onHighlight?.(null);
    onStepAction?.(null);
  };

  const validateAndGoToReveal = () => {
    const state = manager.getState();
    saveCachedCharacter(state);
    try {
      const payload = { attributes: state.attributes };
      window.dispatchEvent(new CustomEvent('drd-creation-step-from-sheet', { detail: { step: 'attributes', payload } }));
    } catch {
      // ignore
    }
    setCreateStep('reveal');
    onHighlight?.('create-reveal', t('createRevealTooltip', lang));
    onStepAction?.({
      step: 'reveal',
      label: t('distributeDice', lang),
      onClick: confirmRevealAndGoToDice,
      disabled: (() => {
        const n = Object.values(Competence).filter((c) => manager.getState().competences[c]?.isRevealed).length;
        return n < MIN_REVEAL || n > MAX_REVEAL;
      })(),
    });
  };

  const confirmRevealAndGoToDice = () => {
    const revealed = Object.values(Competence).filter((c) => manager.getState().competences[c]?.isRevealed);
    if (revealed.length < MIN_REVEAL || revealed.length > MAX_REVEAL) return;
    const stateReveal = manager.getState();
    saveCachedCharacter(stateReveal);
    try {
      const revealedKeys = revealed.map((c) => c as string);
      const payload = { revealed: revealedKeys };
      window.dispatchEvent(new CustomEvent('drd-creation-step-from-sheet', { detail: { step: 'reveal', payload } }));
    } catch {
      // ignore
    }
    setCreateStep('dice');
    onHighlight?.('create-dice', tParam('createDiceTooltip', lang, POOL_DICE));
    onStepAction?.({
      step: 'dice',
      label: t('launchSimulation', lang),
      onClick: confirmDiceAndStart,
      disabled: (() => {
        const diceSum = creationStateDeps?.diceSum ?? Object.values(Competence)
          .filter((c) => manager.getState().competences[c]?.isRevealed)
          .reduce((s, c) => s + (manager.getState().competences[c]?.degreeCount ?? 0), 0);
        return diceSum !== POOL_DICE;
      })(),
    });
  };

  useEffect(() => {
    if (mode !== 'creating') {
      onStepAction?.(null);
      return;
    }
    if (createStep === 'origin' || createStep === 'peuple' || createStep === 'name') {
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
      onHighlight?.('create-attributes', t('createAttrTooltip', lang));
      onStepAction?.({
        step: 'attributes',
        label: t('validate', lang),
        onClick: validateAndGoToReveal,
        disabled: attrSum > POOL_ATTRIBUTE_POINTS,
      });
    } else if (createStep === 'reveal') {
      onHighlight?.('create-reveal', t('createRevealTooltip', lang));
      onStepAction?.({
        step: 'reveal',
        label: t('distributeDice', lang),
        onClick: confirmRevealAndGoToDice,
        disabled: revealedCount < MIN_REVEAL || revealedCount > MAX_REVEAL,
      });
    } else {
      onHighlight?.('create-dice', tParam('createDiceTooltip', lang, POOL_DICE));
      onStepAction?.({
        step: 'dice',
        label: t('launchSimulation', lang),
        onClick: confirmDiceAndStart,
        disabled: diceSum !== POOL_DICE,
      });
    }
  }, [mode, createStep, creationStateDeps?.attrSum, creationStateDeps?.revealedCount, creationStateDeps?.diceSum, lang, onHighlight, onStepAction]);

  const confirmOriginAndGoToPeuple = () => {
    if (!narrativeOrigin) return;
    saveCharacterInfo({ origin: narrativeOrigin });
    try {
      window.dispatchEvent(new CustomEvent('drd-creation-step-from-sheet', { detail: { step: 'origin', payload: { value: narrativeOrigin } } }));
    } catch {
      // ignore
    }
    setCreateStep('peuple');
    setNarrativePeuple('');
  };

  const confirmPeupleAndGoToName = () => {
    if (!narrativePeuple) return;
    const info = loadCharacterInfo() ?? {};
    saveCharacterInfo({ ...info, peuple: narrativePeuple });
    try {
      window.dispatchEvent(new CustomEvent('drd-creation-step-from-sheet', { detail: { step: 'peuple', payload: { value: narrativePeuple } } }));
    } catch {
      // ignore
    }
    setCreateStep('name');
  };

  const confirmNameAndGoToAttributes = () => {
    const info = loadCharacterInfo() ?? {};
    saveCharacterInfo({ ...info, name: narrativeName.trim() || undefined });
    try {
      window.dispatchEvent(new CustomEvent('drd-creation-step-from-sheet', { detail: { step: 'name', payload: { value: narrativeName.trim() } } }));
    } catch {
      // ignore
    }
    setCreateStep('attributes');
    onHighlight?.('create-attributes', t('createAttrTooltip', lang));
  };

  // Only render narrative steps (origin, peuple, name) when in creating mode and on those steps
  if (mode !== 'creating' || !(createStep === 'origin' || createStep === 'peuple' || createStep === 'name')) {
    return null;
  }

  return (
    <div
      className="px-3 py-2 border-b border-border-dark flex flex-wrap items-center gap-2 shrink-0"
      style={{ background: 'rgba(0,0,0,0.25)' }}
    >
      {createStep === 'origin' && (
        <>
          <label className="text-text-cream text-sm font-semibold shrink-0">{t('chooseOrigin', lang)}</label>
          <select
            value={narrativeOrigin}
            onChange={(e) => setNarrativeOrigin(e.target.value)}
            className="px-2 py-1 rounded border border-border-dark bg-black/30 text-text-cream text-sm min-w-[140px]"
          >
            <option value="">—</option>
            {ORIGINS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={confirmOriginAndGoToPeuple}
            disabled={!narrativeOrigin}
            className="px-3 py-1.5 bg-red-theme text-text-cream border-2 border-border-dark rounded font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-800"
          >
            {t('nextStep', lang)}
          </button>
        </>
      )}
      {createStep === 'peuple' && (
        <>
          <label className="text-text-cream text-sm font-semibold shrink-0">{t('choosePeuple', lang)}</label>
          <select
            value={narrativePeuple}
            onChange={(e) => setNarrativePeuple(e.target.value)}
            className="px-2 py-1 rounded border border-border-dark bg-black/30 text-text-cream text-sm min-w-[160px]"
          >
            <option value="">—</option>
            {(PEUPLES_BY_ORIGIN[narrativeOrigin] ?? []).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={confirmPeupleAndGoToName}
            disabled={!narrativePeuple}
            className="px-3 py-1.5 bg-red-theme text-text-cream border-2 border-border-dark rounded font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-800"
          >
            {t('nextStep', lang)}
          </button>
        </>
      )}
      {createStep === 'name' && (
        <>
          <label className="text-text-cream text-sm font-semibold shrink-0">{t('characterNameLabel', lang)}</label>
          <input
            type="text"
            value={narrativeName}
            onChange={(e) => setNarrativeName(e.target.value)}
            placeholder={lang === 'fr' ? 'Optionnel' : 'Optional'}
            className="px-2 py-1 rounded border border-border-dark bg-black/30 text-text-cream text-sm min-w-[120px]"
          />
          <button
            type="button"
            onClick={confirmNameAndGoToAttributes}
            className="px-3 py-1.5 bg-red-theme text-text-cream border-2 border-border-dark rounded font-semibold text-sm hover:bg-amber-800"
          >
            {t('nextStep', lang)}
          </button>
        </>
      )}
    </div>
  );
}
