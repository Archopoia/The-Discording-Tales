'use client';

import { useState, useEffect } from 'react';
import { CharacterSheetManager } from '@/game/character/CharacterSheetManager';
import { Attribute } from '@/game/character/data/AttributeData';
import { Competence } from '@/game/character/data/CompetenceData';
import { Souffrance } from '@/game/character/data/SouffranceData';
import { loadCachedCharacter, saveCachedCharacter, loadCharacterInfo, saveCharacterInfo } from '@/lib/simulationStorage';
import type { CharacterSheetLang } from '@/lib/characterSheetI18n';
import { t, tParam } from '@/lib/characterSheetI18n';

/** Book "sans dés": exactly one of +2,+1,0,0,0,0,-1,-2 per attribute (×10 on sheet). Sum = 0. */
export const ATTRIBUTE_SPREAD_SHEET = [20, 10, 0, 0, 0, 0, -10, -20] as const;

export const MIN_REVEAL = 3;
export const MAX_REVEAL = 5;
export const POOL_DICE = 10;

/** True if the 8 attribute values (sheet scale) are exactly the spread multiset. */
export function attributesMatchSpread(attributes: Record<Attribute, number>): boolean {
  const vals = Object.values(attributes).sort((a, b) => a - b);
  const want = [...ATTRIBUTE_SPREAD_SHEET].sort((a, b) => a - b);
  return vals.length === 8 && vals.every((v, i) => v === want[i]);
}

export type CreateStepType = 'origin' | 'peuple' | 'name' | 'attributes' | 'reveal' | 'dice';

export type StepActionPayload =
  | { step: 'attributes' | 'reveal' | 'dice'; label: string; onClick: () => void; disabled: boolean }
  | null;

interface SimulationEventLogProps {
  lang: CharacterSheetLang;
  manager: CharacterSheetManager;
  updateSheet: () => void;
  onHighlight?: (id: string | null, tooltip?: string) => void;
  onStepAction?: (action: StepActionPayload) => void;
  creationStateDeps?: { attributesValid?: boolean; revealedCount: number; diceSum?: number };
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

  // When the user selects origin/peuple/name in the chat, persist to storage and advance step (chat-only; no pickers in sheet)
  useEffect(() => {
    const handler = (ev: Event) => {
      const e = ev as CustomEvent<{ field: string; value: string }>;
      const field = e.detail?.field;
      const value = e.detail?.value ?? '';
      if (field === 'origin') {
        saveCharacterInfo({ ...loadCharacterInfo(), origin: value });
        setCreateStep('peuple');
      } else if (field === 'peuple') {
        saveCharacterInfo({ ...loadCharacterInfo(), peuple: value });
        setCreateStep('name');
      } else if (field === 'name') {
        saveCharacterInfo({ ...loadCharacterInfo(), name: value });
        setCreateStep('attributes');
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
    onHighlight?.(null);
    onStepAction?.(null);
    setMode('running');
    setCreateStep('attributes');
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
        const st = manager.getState();
        const sum =
          Object.values(Competence)
            .filter((c) => st.competences[c]?.isRevealed)
            .reduce((s, c) => s + (st.competences[c]?.degreeCount ?? 0), 0) +
          Object.values(Souffrance).reduce((s, souf) => s + (st.souffrances[souf]?.resistanceDegreeCount ?? 0), 0);
        return sum !== POOL_DICE;
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
    const attrs = manager.getState().attributes;
    const attributesValid = creationStateDeps?.attributesValid ?? attributesMatchSpread(attrs);
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
        disabled: !attributesValid,
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
  }, [mode, createStep, creationStateDeps?.attributesValid, creationStateDeps?.revealedCount, creationStateDeps?.diceSum, lang, onHighlight, onStepAction]);

  // When in creating mode but still on origin/peuple/name, show hint only (choices are made in the chat)
  if (mode !== 'creating' || !(createStep === 'origin' || createStep === 'peuple' || createStep === 'name')) {
    return null;
  }

  return (
    <div
      className="px-3 py-2 border-b border-border-dark flex flex-wrap items-center gap-2 shrink-0"
      style={{ background: 'rgba(0,0,0,0.25)' }}
    >
      <span className="text-text-cream text-sm">{t('narrativeInChatHint', lang)}</span>
    </div>
  );
}
