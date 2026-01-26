'use client';

import { useState, useRef, useEffect } from 'react';
import { CharacterSheetManager } from '@/game/character/CharacterSheetManager';
import { Attribute, getAttributeName } from '@/game/character/data/AttributeData';
import { Competence, getCompetenceName, getCompetenceAction } from '@/game/character/data/CompetenceData';
import { getActionLinkedAttribute } from '@/game/character/data/ActionData';
import { Souffrance, getSouffranceName, getResistanceCompetenceName } from '@/game/character/data/SouffranceData';
import { loadCachedCharacter, saveCachedCharacter } from '@/lib/simulationStorage';
import { MARKS_TO_EPROUVER } from '@/game/character/CharacterSheetManager';

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

const POOL_ATTRIBUTE_POINTS = 18;
const MIN_REVEAL = 3;
const MAX_REVEAL = 5;

const REVEAL_OPTIONS: Competence[] = [
  Competence.GRIMPE,
  Competence.LUTTE,
  Competence.VISION,
  Competence.NEGOCIATION,
  Competence.INVESTIGATION,
  Competence.FLUIDITE,
  Competence.ARTISANAT,
  Competence.COMMANDEMENT,
  Competence.ESQUIVE,
  Competence.DEBROUILLARDISE,
];

const CHALLENGES: { description: string; suggested?: Competence }[] = [
  { description: 'Escalader le mur', suggested: Competence.GRIMPE },
  { description: 'Convaincre le garde', suggested: Competence.NEGOCIATION },
  { description: 'Fouiller la pièce', suggested: Competence.INVESTIGATION },
  { description: 'Esquiver l’attaque', suggested: Competence.ESQUIVE },
  { description: 'Réparer le mécanisme', suggested: Competence.DEBROUILLARDISE },
];

interface SimulationEventLogProps {
  manager: CharacterSheetManager;
  updateSheet: () => void;
  onHighlight?: (id: string | null, tooltip?: string) => void;
}

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

export default function SimulationEventLog({
  manager,
  updateSheet,
  onHighlight,
}: SimulationEventLogProps) {
  const [events, setEvents] = useState<SimEvent[]>([]);
  const [mode, setMode] = useState<'idle' | 'creating' | 'running'>('idle');
  const [createStep, setCreateStep] = useState<'attributes' | 'reveal'>('attributes');
  const [attrPoints, setAttrPoints] = useState<Record<Attribute, number>>(() =>
    Object.values(Attribute).reduce((a, k) => ({ ...a, [k]: 0 }), {} as Record<Attribute, number>)
  );
  const [revealSelected, setRevealSelected] = useState<Set<Competence>>(new Set());
  const [awaitingSkillChoice, setAwaitingSkillChoice] = useState(false);
  const [runningChallengeIdx, setRunningChallengeIdx] = useState(0);
  const logEndRef = useRef<HTMLDivElement>(null);

  const push = (type: SimEventType, text: string, step?: number) => {
    setEvents((prev) => [...prev, { type, text, step: step ?? prev.length + 1 }]);
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const startSimulation = () => {
    const cached = loadCachedCharacter();
    if (cached) {
      manager.loadState(cached);
      updateSheet();
      push('info', 'Personnage chargé depuis la session.');
      setMode('running');
      setRunningChallengeIdx(0);
      runChallenge(0);
    } else {
      setMode('creating');
      setCreateStep('attributes');
      setEvents([]);
      push('info', 'Créez votre personnage : répartissez les points d’attributs, puis révéelez 3 à 5 compétences.');
    }
  };

  const applyCreateAttributes = () => {
    Object.entries(attrPoints).forEach(([k, v]) => {
      manager.setAttribute(k as Attribute, v);
    });
    updateSheet();
    push('info', `Attributs définis (${Object.values(attrPoints).join(', ')})`);
    setCreateStep('reveal');
    onHighlight?.(null);
  };

  const toggleReveal = (comp: Competence) => {
    setRevealSelected((prev) => {
      const next = new Set(prev);
      if (next.has(comp)) next.delete(comp);
      else if (next.size < MAX_REVEAL) next.add(comp);
      return next;
    });
  };

  const finishCreate = () => {
    if (revealSelected.size < MIN_REVEAL || revealSelected.size > MAX_REVEAL) return;
    revealSelected.forEach((comp) => manager.revealCompetence(comp));
    updateSheet();
    const names = [...revealSelected].map(getCompetenceName).join(', ');
    push('info', `Compétences révélées : ${names}. Seules ces compétences peuvent gagner des marques.`);
    saveCachedCharacter(manager.getState());
    setMode('running');
    setCreateStep('attributes');
    setRevealSelected(new Set());
    setRunningChallengeIdx(0);
    runChallenge(0);
    onHighlight?.(null);
  };

  const runChallenge = (idx: number) => {
    const c = CHALLENGES[idx % CHALLENGES.length];
    push('challenge', `Défi : ${c.description}`);
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
    const critFail = Math.random() < 0.15;
    const marks = critFail ? 5 : 1;
    for (let i = 0; i < marks; i++) manager.addCompetenceMark(comp);
    updateSheet();
    push(
      'resolve',
      critFail ? `Échec critique → +${marks} Marques ${getCompetenceName(comp)}` : `Échec → +1 Marque ${getCompetenceName(comp)}`
    );
    push('xp', `Marques : ${manager.getTotalMarks(comp)}/${MARKS_TO_EPROUVER} pour ${getCompetenceName(comp)}`);
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
          Journal de simulation — Souffrance → Résistance → XP → Degrés → Maîtrises
        </span>
        <div className="flex items-center gap-2">
          {mode === 'idle' && (
            <button
              type="button"
              onClick={startSimulation}
              className="px-3 py-1.5 bg-red-theme text-text-cream border-2 border-border-dark rounded font-semibold text-sm hover:bg-amber-800 transition-colors"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
            >
              Démarrer la simulation
            </button>
          )}
          {mode === 'creating' && createStep === 'attributes' && (
            <button
              type="button"
              onClick={applyCreateAttributes}
              disabled={Object.values(attrPoints).reduce((s, n) => s + n, 0) > POOL_ATTRIBUTE_POINTS}
              className="px-3 py-1.5 bg-amber-700 text-text-cream border-2 border-border-dark rounded font-semibold text-sm hover:bg-amber-600 disabled:opacity-50"
            >
              Valider les attributs
            </button>
          )}
          {mode === 'creating' && createStep === 'reveal' && (
            <button
              type="button"
              onClick={finishCreate}
              disabled={revealSelected.size < MIN_REVEAL || revealSelected.size > MAX_REVEAL}
              className="px-3 py-1.5 bg-amber-700 text-text-cream border-2 border-border-dark rounded font-semibold text-sm hover:bg-amber-600 disabled:opacity-50"
            >
              Révéler {revealSelected.size} compétence(s) et lancer
            </button>
          )}
          {mode === 'running' && !isChoosingSkill && (
            <button
              type="button"
              onClick={nextChallenge}
              className="px-3 py-1.5 bg-red-theme text-text-cream border-2 border-border-dark rounded font-semibold text-sm hover:bg-amber-800"
            >
              Défi suivant
            </button>
          )}
        </div>
      </div>

      {mode === 'creating' && createStep === 'attributes' && (
        <div className="p-3 border-b border-border-dark bg-black/20">
          <p className="text-xs text-text-cream mb-2">
            Répartissez jusqu’à {POOL_ATTRIBUTE_POINTS} points entre les 8 attributs (chaque case = +1).
          </p>
          <div className="flex flex-wrap gap-2">
            {(Object.values(Attribute) as Attribute[]).map((attr) => (
              <label key={attr} className="flex items-center gap-1 text-xs text-text-cream">
                <span className="w-16">{getAttributeName(attr)}</span>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={attrPoints[attr]}
                  onChange={(e) =>
                    setAttrPoints((prev) => ({
                      ...prev,
                      [attr]: Math.max(0, Math.min(10, parseInt(e.target.value, 10) || 0)),
                    }))
                  }
                  className="w-12 bg-parchment-dark border border-border-dark rounded px-1 text-center text-text-dark"
                />
              </label>
            ))}
          </div>
          <p className="text-xs text-amber-200/90 mt-1">
            Total : {Object.values(attrPoints).reduce((s, n) => s + n, 0)} / {POOL_ATTRIBUTE_POINTS}
          </p>
        </div>
      )}

      {mode === 'creating' && createStep === 'reveal' && (
        <div className="p-3 border-b border-border-dark bg-black/20">
          <p className="text-xs text-text-cream mb-2">
            Choisissez de {MIN_REVEAL} à {MAX_REVEAL} compétences à révéler. Seules les compétences révélées pourront gagner des marques.
          </p>
          <div className="flex flex-wrap gap-2">
            {REVEAL_OPTIONS.map((comp) => (
              <button
                key={comp}
                type="button"
                onClick={() => toggleReveal(comp)}
                className={`px-2 py-1 rounded text-xs border-2 font-semibold transition-colors ${
                  revealSelected.has(comp)
                    ? 'bg-amber-700 border-amber-500 text-text-cream'
                    : 'bg-parchment-dark border-border-dark text-text-dark hover:border-amber-600'
                }`}
              >
                {getCompetenceName(comp)}
              </button>
            ))}
          </div>
          <p className="text-xs text-amber-200/90 mt-1">
            Sélectionnées : {revealSelected.size} / {MAX_REVEAL}
          </p>
        </div>
      )}

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
        className="max-h-40 overflow-y-auto p-2 space-y-1 font-mono text-xs"
        style={{ background: 'rgba(0,0,0,0.35)', minHeight: '80px' }}
      >
        {events.length === 0 && mode === 'idle' && (
          <div className="text-gray-400 italic py-2">
            Cliquez sur « Démarrer la simulation » pour voir le pipeline Souffrance → Résistance → XP → Degrés → Maîtrises.
          </div>
        )}
        {events.map((ev, i) => (
          <div key={i} className={eventStyle(ev.type)}>
            <span className="text-gray-500 mr-2">#{ev.step ?? i + 1}</span>
            {ev.text}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
