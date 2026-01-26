'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CharacterSheetManager, MARKS_TO_EPROUVER } from '@/game/character/CharacterSheetManager';
import { Attribute, getAttributeName, getAttributeAbbreviation } from '@/game/character/data/AttributeData';
import { Aptitude, getAptitudeName, getAptitudeAttributes } from '@/game/character/data/AptitudeData';
import { Action, getActionName, getActionAptitude, getActionLinkedAttribute } from '@/game/character/data/ActionData';
import { Competence, getCompetenceName, getCompetenceAction } from '@/game/character/data/CompetenceData';
import { Souffrance, getSouffranceAttribute, getResistanceCompetenceName } from '@/game/character/data/SouffranceData';
import { getMasteries } from '@/game/character/data/MasteryRegistry';
import { getLevelName } from '@/lib/utils';
import DegreeInput from './ui/DegreeInput';
import ProgressBar from './ui/ProgressBar';
import ExpandableSection from './ui/ExpandableSection';
import Tooltip from './ui/Tooltip';
import SimulationEventLog, { type StepActionPayload, POOL_ATTRIBUTE_POINTS, MIN_REVEAL, MAX_REVEAL } from './SimulationEventLog';

interface CharacterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  manager?: CharacterSheetManager; // Optional: if provided, use this manager instead of creating a new one
  godMode?: boolean; // God mode allows editing normally disabled fields
}

/**
 * Custom hook to manage character sheet state updates
 * Simplifies the pattern of manager.setX() + setState(manager.getState())
 */
function useCharacterSheet(manager: CharacterSheetManager) {
  const [state, setState] = useState(manager.getState());

  const updateState = () => {
    setState(manager.getState());
  };

  return { state, updateState };
}

export default function CharacterSheet({ isOpen, onClose, manager: externalManager, godMode = false }: CharacterSheetProps) {
  const [internalManager] = useState(() => new CharacterSheetManager());
  const manager = externalManager || internalManager;
  const { state, updateState } = useCharacterSheet(manager);
  
  // Update state periodically when using external manager (to sync with game state)
  useEffect(() => {
    if (!externalManager) return;
    
    // Poll for updates every 100ms when sheet is open
    const interval = setInterval(() => {
      updateState();
    }, 100);
    
    return () => clearInterval(interval);
  }, [externalManager, updateState]);
  const [expandedActions, setExpandedActions] = useState<Set<Action>>(new Set());
  const [expandedCompetences, setExpandedCompetences] = useState<Set<Competence>>(new Set());
  const [masterySelectionOpen, setMasterySelectionOpen] = useState<Competence | null>(null);
  const [flippedAptitudes, setFlippedAptitudes] = useState<Set<Aptitude>>(new Set());
  const [masteryDropdownPosition, setMasteryDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [hoveredAttribute, setHoveredAttribute] = useState<{ aptitude: Aptitude; attributeIndex: number } | null>(null);
  const [hoveredAction, setHoveredAction] = useState<Action | null>(null);
  const [hoveredRevealCompetence, setHoveredRevealCompetence] = useState<Competence | null>(null);
  const [simHighlightId, setSimHighlightId] = useState<string | null>(null);
  const [simTooltip, setSimTooltip] = useState<string | null>(null);
  const [stepAction, setStepAction] = useState<StepActionPayload>(null);
  const [tutorialOverlayHeight, setTutorialOverlayHeight] = useState(0);
  const masteryButtonRefs = useRef<Map<Competence, HTMLButtonElement>>(new Map());
  const overlayRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const attributesSectionRef = useRef<HTMLElement>(null);

  // Update dropdown position on scroll/resize and close on outside click
  useEffect(() => {
    if (!masterySelectionOpen || !masteryDropdownPosition) return;
    
    const updatePosition = () => {
      const buttonEl = masteryButtonRefs.current.get(masterySelectionOpen!);
      if (buttonEl) {
        const rect = buttonEl.getBoundingClientRect();
        setMasteryDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width
        });
      }
    };
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside both the button and the dropdown portal
      const dropdownElement = document.querySelector('[data-mastery-dropdown]');
      if (
        !target.closest('.mastery-selection-container') && 
        !(dropdownElement && dropdownElement.contains(target))
      ) {
        setMasterySelectionOpen(null);
        setMasteryDropdownPosition(null);
      }
    };
    
    // Update position on scroll/resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [masterySelectionOpen, masteryDropdownPosition]);

  // Lock background: prevent scroll and interaction when character sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('character-sheet-open');
      scrollPositionRef.current = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPositionRef.current}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
    } else {
      document.body.classList.remove('character-sheet-open');
      const restore = scrollPositionRef.current;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      window.scrollTo(0, restore);
    }
    return () => {
      document.body.classList.remove('character-sheet-open');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollPositionRef.current);
    };
  }, [isOpen]);

  // Auto-focus the modal and trap focus inside when open
  useEffect(() => {
    if (!isOpen) return;
    const overlay = overlayRef.current;
    if (!overlay) return;

    const focusOverlay = () => overlay.focus();
    const raf = requestAnimationFrame(focusOverlay);

    const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const getFocusables = () => Array.from(overlay.querySelectorAll<HTMLElement>(FOCUSABLE));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = getFocusables();
      if (focusables.length === 0) return;
      const current = document.activeElement as HTMLElement;
      const idx = focusables.indexOf(current);
      if (idx === -1 && !e.shiftKey) {
        e.preventDefault();
        focusables[0].focus();
        return;
      }
      if (idx === -1 && e.shiftKey) {
        e.preventDefault();
        focusables[focusables.length - 1].focus();
        return;
      }
      const next = e.shiftKey ? (idx <= 0 ? focusables.length - 1 : idx - 1) : (idx >= focusables.length - 1 ? 0 : idx + 1);
      e.preventDefault();
      focusables[next].focus();
    };

    overlay.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      overlay.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Tutorial creation: expand all actions when in reveal step
  useEffect(() => {
    if (simHighlightId === 'create-reveal') {
      setExpandedActions(new Set(Object.values(Action)));
    }
  }, [simHighlightId]);

  // Tutorial creation: scroll target into view
  useEffect(() => {
    if (simHighlightId === 'create-attributes' || simHighlightId === 'create-reveal') {
      attributesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [simHighlightId]);

  // Tutorial overlay: match content scroll height so it covers area above/below the aptitudes section (section uses z-110 and stays on top)
  useEffect(() => {
    if (simHighlightId !== 'create-attributes' && simHighlightId !== 'create-reveal') return;
    const el = contentRef.current;
    if (!el) return;
    const sync = () => setTutorialOverlayHeight(el.scrollHeight);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [simHighlightId]);

  if (!isOpen) return null;

  const attrSum = Object.values(state.attributes).reduce((s, n) => s + n, 0);
  const revealedCount = Object.values(Competence).filter((c) => state.competences[c]?.isRevealed).length;

  const handleAttributeChange = (attr: Attribute, value: number) => {
    let valueToSet = value;
    if (simHighlightId === 'create-attributes') {
      const othersSum = attrSum - (state.attributes[attr] ?? 0);
      const maxForAttr = Math.max(-50, POOL_ATTRIBUTE_POINTS - othersSum);
      valueToSet = Math.min(50, Math.max(-50, Math.min(value, maxForAttr)));
    }
    manager.setAttribute(attr, valueToSet);
    updateState();
  };

  const toggleSet = <T,>(set: Set<T>, item: T): Set<T> => {
    const newSet = new Set(set);
    if (newSet.has(item)) {
      newSet.delete(item);
    } else {
      newSet.add(item);
    }
    return newSet;
  };

  const toggleAction = (action: Action) => {
    setExpandedActions(toggleSet(expandedActions, action));
  };

  const toggleCompetence = (comp: Competence) => {
    setExpandedCompetences(toggleSet(expandedCompetences, comp));
  };

  const toggleAptitudeFlip = (aptitude: Aptitude) => {
    setFlippedAptitudes(toggleSet(flippedAptitudes, aptitude));
  };

  const revealCompetence = (comp: Competence) => {
    manager.revealCompetence(comp);
    updateState();
  };

  // Get actions for an aptitude
  const getActionsForAptitude = (aptitude: Aptitude): Action[] => {
    return Object.values(Action).filter((action) => getActionAptitude(action) === aptitude);
  };

  // Get compétences d'Action for an action (compétences used to act)
  const getCompetencesForAction = (action: Action): Competence[] => {
    return Object.values(Competence).filter((comp) => getCompetenceAction(comp) === action);
  };

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="character-sheet-title"
      tabIndex={-1}
      className="fixed inset-0 z-[10001] flex items-center justify-center overflow-hidden p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
      onWheel={(e) => e.stopPropagation()}
    >
      <div 
        className="w-full max-w-[95vw] h-[95vh] max-h-[95vh] flex flex-col rounded-lg border-4 border-border-dark shadow-2xl animate-swing-in overflow-hidden"
        style={{
          background: `
            radial-gradient(#6100001f 3px, transparent 4px),
            radial-gradient(#6100001f 3px, transparent 4px),
            linear-gradient(45deg, transparent 74px, #78c9a3 75px, transparent 76px, transparent 109px),
            linear-gradient(-45deg, transparent 75px, #78c9a3 76px, transparent 77px, transparent 109px),
            #fffaec
          `,
          backgroundSize: '109px 109px, 109px 109px, 109px 109px, 109px 109px',
          backgroundPosition: '54px 55px, 0px 0px, 0px 0px, 0px 0px',
          boxShadow: `
            0 0 20px rgba(0, 0, 0, 0.5),
            inset 0 0 0 2px #ceb68d,
            inset 0 0 0 5px #ffebc6,
            0 0 40px rgba(100, 48, 48, 0.6)
          `
        }}
      >
        {/* Header */}
        <div 
          className="flex justify-between items-center px-6 py-4 border-b-[3px] border-border-dark relative z-10"
          style={{
            background: `
              radial-gradient(circle at 20% 20%, rgba(100, 48, 48, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(100, 48, 48, 0.3) 0%, transparent 50%),
              linear-gradient(135deg, #643030b9 0%, #643030 100%)
            `,
            boxShadow: 'inset 0 0 0 2px #ceb68d'
          }}
        >
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 20px,
                rgba(184, 134, 11, 0.1) 20px,
                rgba(184, 134, 11, 0.1) 21px
              )`
            }}
          />
          <div className="flex items-center gap-4">
            <h2 id="character-sheet-title" className="font-medieval text-3xl font-bold text-text-cream relative z-10 tracking-wide" style={{
              textShadow: '0 1px black, 0 2px rgb(19, 19, 19), 0 3px rgb(30, 30, 30), 0 4px rgb(50, 50, 50), 0 5px rgb(70, 70, 70), 0 6px #555'
            }}>
              Feuille de Personnage
            </h2>
            {godMode && (
              <span className="font-medieval text-sm font-bold text-yellow-400 relative z-10 px-2 py-1 border border-yellow-400 rounded animate-pulse" style={{
                textShadow: '0 0 8px rgba(255, 215, 0, 0.8), 0 1px 2px rgba(0, 0, 0, 0.8)',
                boxShadow: '0 0 10px rgba(255, 215, 0, 0.5), inset 0 0 5px rgba(255, 215, 0, 0.3)'
              }}>
                ⚡ GOD MODE ⚡
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-theme text-text-cream border-2 border-border-dark rounded font-medieval font-semibold transition-all duration-300 relative z-10 hover:bg-hover-bg hover:text-text-dark hover:-translate-y-0.5"
            style={{
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3), inset 0 0 0 1px #ffebc6'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 15px 5px #ffebc6, 0 4px 8px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.3), inset 0 0 0 1px #ffebc6';
            }}
          >
            Fermer (C)
          </button>
        </div>

        {/* Content - Scrollable */}
        <div
          ref={contentRef}
          className="character-sheet-content flex-1 overflow-y-auto overflow-x-visible p-8 relative z-10"
          style={{ paddingTop: '2rem', paddingBottom: '2rem', isolation: 'isolate' }}
        >
          {/* Tutorial: overlay inside content so aptitudes section (z-110) can sit above it; overlay height = full scroll so top/bottom dimmed */}
          {(simHighlightId === 'create-attributes' || simHighlightId === 'create-reveal') && (
            <>
              <div
                className="absolute left-0 right-0 top-0 pointer-events-none"
                style={{
                  zIndex: 100,
                  background: 'rgba(0,0,0,0.65)',
                  height: tutorialOverlayHeight,
                }}
                aria-hidden
              />
              <div
                className="absolute bottom-6 left-1/2 -translate-x-1/2 min-w-[280px] max-w-[90%] z-[120] rounded-lg border-2 p-4 shadow-xl pointer-events-auto"
                style={{ borderColor: 'rgba(143, 201, 196, 0.85)', background: 'linear-gradient(180deg, rgba(40,28,18,0.98) 0%, rgba(30,22,14,0.99) 100%)', boxShadow: '0 0 0 1px rgba(168,221,217,0.5), 0 8px 24px rgba(0,0,0,0.5)' }}
              >
                <p className="text-sm mb-3 font-medieval" style={{ color: '#eefaf9' }}>{simTooltip ?? ''}</p>
                {simHighlightId === 'create-attributes' && (
                  <p className="text-sm mb-2 font-medieval font-semibold" style={{ color: '#e8f8f7' }}>
                    Total : {attrSum} / {POOL_ATTRIBUTE_POINTS} points
                  </p>
                )}
                {simHighlightId === 'create-reveal' && (
                  <p className="text-sm mb-2 font-medieval font-semibold" style={{ color: '#e8f8f7' }}>
                    Compétences révélées : {revealedCount} / {MAX_REVEAL} (min {MIN_REVEAL})
                  </p>
                )}
                {stepAction && (
                  <button
                    type="button"
                    onClick={stepAction.onClick}
                    disabled={stepAction.disabled}
                    className="tutorial-panel-btn w-full py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed text-text-cream font-semibold border-2 border-border-dark rounded transition-colors"
                  >
                    {stepAction.label}
                  </button>
                )}
              </div>
            </>
          )}

          {/* Simulation event log – above all columns */}
          <SimulationEventLog
            manager={manager}
            updateSheet={updateState}
            onHighlight={(id, tooltip) => {
              setSimHighlightId(id);
              setSimTooltip(tooltip ?? null);
            }}
            onStepAction={setStepAction}
            creationStateDeps={{
              attrSum,
              revealedCount,
            }}
          />

          {/* Aptitudes Section - 8 Columns Side by Side (tutorial target; z-[110] so it draws above the overlay at z-100) */}
          <section
            ref={attributesSectionRef}
            data-sim-highlight={simHighlightId === 'create-attributes' ? 'create-attributes' : simHighlightId === 'create-reveal' ? 'create-reveal' : undefined}
            className={`mt-8 relative flex gap-4 items-start transition-all ${simHighlightId === 'create-attributes' || simHighlightId === 'create-reveal' ? 'z-[110] tutorial-spotlight-target' : ''}`}
          >
            <div className="flex gap-0 flex-1 items-start" style={{ minWidth: 0 }}>
                {Object.values(Aptitude).map((aptitude) => {
                const [atb1, atb2, atb3] = getAptitudeAttributes(aptitude);
                const level = state.aptitudeLevels[aptitude];
                const actions = getActionsForAptitude(aptitude);
                
                const isFlipped = flippedAptitudes.has(aptitude);
                
                return (
                  <div 
                    key={aptitude}
                    className="relative flex flex-col"
                    style={{
                      perspective: '1000px',
                      flex: isFlipped ? '0 0 6.25%' : '1 1 12.5%',
                      minWidth: '0',
                      transition: 'flex 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {/* Souffrance Bar - At the top of each column, fills from bottom upward */}
                    {(() => {
                        // Find the souffrance linked to the primary attribute (atb1) of this aptitude
                        const linkedSouffrance = Object.values(Souffrance).find(
                          (souf) => getSouffranceAttribute(souf) === atb1
                        );
                        
                        if (linkedSouffrance) {
                          const soufData = state.souffrances[linkedSouffrance];
                          const degreeCountRaw = soufData?.degreeCount || 0;
                          const degreeCount = Math.round(degreeCountRaw * 10) / 10; // Round to 1 decimal to avoid floating point errors
                          const maxDS = 26; // Max DS (Degrees of Souffrance) before death
                          
                          // Colors toned down to match the muted, earthy theme
                          // Muted, desaturated colors that fit the parchment/brown aesthetic
                          const souffranceColors: Record<Souffrance, string> = {
                            [Souffrance.BLESSURES]: '#8b5a5a',    // Muted red-brown - physical wounds
                            [Souffrance.FATIGUES]: '#a67c52',     // Muted orange-brown - exhaustion
                            [Souffrance.ENTRAVES]: '#9a8a5f',     // Muted yellow-brown - impediments
                            [Souffrance.DISETTES]: '#6b8a6b',     // Muted green-brown - hunger/thirst
                            [Souffrance.ADDICTIONS]: '#6b8a8a',   // Muted teal-brown - dependencies
                            [Souffrance.MALADIES]: '#6b7a8a',     // Muted blue-gray - diseases
                            [Souffrance.FOLIES]: '#8a7a8a',       // Muted purple-gray - mental disorders
                            [Souffrance.RANCOEURS]: '#8a6a7a',    // Muted mauve-brown - resentments
                          };
                          
                          const barColor = souffranceColors[linkedSouffrance];
                          
                          // Calculate height percentage, but ensure minimum visibility
                          const barHeightPercent = Math.min(100, (degreeCount / maxDS) * 100);
                          
                          // Use fixed pixel height for small values to ensure visibility
                          // For larger values, use percentage
                          const useFixedHeight = degreeCount > 0 && barHeightPercent < 5;
                          const barHeight = useFixedHeight ? `${Math.max(20, degreeCount * 4)}px` : `${barHeightPercent}%`;
                          
                          return (
                            <div
                              data-sim-highlight={`souffrance-${linkedSouffrance}`}
                              className={`relative w-full overflow-hidden rounded transition-all ${simHighlightId === `souffrance-${linkedSouffrance}` ? 'tutorial-ring' : ''}`}
                              style={{
                                height: '120px', // Increased height for better visibility
                                minHeight: '120px',
                                backgroundColor: 'transparent',
                                marginBottom: '0', // No space between bar and aptitude card
                              }}
                            >
                              {/* Bar that grows from bottom upward */}
                              <div
                                className="absolute bottom-0 left-0 right-0 w-full"
                                style={{
                                  height: barHeight,
                                  backgroundColor: barColor,
                                  opacity: degreeCount > 0 ? 0.85 : 0,
                                  zIndex: 1,
                                  transition: 'height 0.3s ease-out, opacity 0.3s ease-out',
                                  pointerEvents: 'none',
                                  minHeight: degreeCount > 0 ? '2px' : '0px',
                                }}
                              >
                                {/* DS (Degrees of Souffrance) Count displayed in the bar */}
                                {degreeCount > 0 && (
                                  <div
                                    className="absolute inset-0 flex items-center justify-center"
                                    style={{
                                      color: '#ffffff',
                                      textShadow: '1px 1px 1px rgba(0, 0, 0, 1), -1px -1px 1px rgba(0, 0, 0, 0.9)',
                                      fontWeight: 'bold',
                                      fontSize: degreeCount >= 10 ? '0.7rem' : '0.75rem',
                                      fontFamily: 'monospace',
                                      zIndex: 2,
                                      pointerEvents: 'none',
                                    }}
                                  >
                                    {degreeCount.toFixed(1)}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                    <div
                      className="relative w-full flex-1"
                      style={{
                        transformStyle: 'preserve-3d',
                        transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        minHeight: '100%',
                      }}
                    >
                      {/* Front Face */}
                      <div 
                        className="bg-hover-bg border-2 border-border-tan rounded-lg p-3 transition-all duration-300 hover:bg-parchment-light hover:border-gold-glow relative"
                        style={{
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 0 0 1px #ceb68d',
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transform: 'rotateY(0deg)',
                          width: '100%',
                          minWidth: 0,
                        }}
                      >
                        {/* Aptitude Name with Modifier - Name on left, Modifier on right */}
                        <div 
                          className="mb-2 pb-2 border-b-2 border-border-dark cursor-pointer relative z-10"
                          onClick={() => toggleAptitudeFlip(aptitude)}
                          style={{ backgroundColor: 'transparent' }}
                        >
                          <div className="flex justify-between items-center">
                            <div className="font-medieval text-xs font-bold text-red-theme uppercase tracking-wide">
                              {getAptitudeName(aptitude)}
                            </div>
                            <div className="font-medieval text-2xl font-bold text-text-dark" style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.2)' }}>
                              {level >= 0 ? '+' : ''}{level}
                            </div>
                          </div>
                        </div>

                    {/* Attributes Section - Two Column Layout */}
                    <div className="flex gap-4 mb-3 pb-3 border-b-2 border-border-dark relative z-10" style={{ backgroundColor: 'transparent' }}>
                      {/* Left Column - Main Attribute with Input */}
                      <div className="flex flex-col items-start gap-2">
                        {/* Input box above the name */}
                        <DegreeInput
                          value={state.attributes[atb1]}
                          onChange={(value) => handleAttributeChange(atb1, value)}
                          min={-50}
                          max={simHighlightId === 'create-attributes' ? Math.min(50, POOL_ATTRIBUTE_POINTS - attrSum + (state.attributes[atb1] ?? 0)) : 50}
                          size="md"
                          className={simHighlightId === 'create-attributes' ? 'tutorial-input-highlight' : ''}
                        />
                        {/* Attribute name in full caps */}
                        <label className="font-medieval text-xs font-bold text-red-theme uppercase tracking-wide">
                          {getAttributeName(atb1).toUpperCase()}
                        </label>
                      </div>

                      {/* Right Column - Three Attributes Stacked */}
                      <div className="flex-1 flex flex-col items-end justify-start gap-1">
                        {/* Attribute 1 - AAA format (all caps) */}
                        <div
                          className="font-medieval text-xs font-bold text-red-theme tracking-wide cursor-help"
                          onMouseEnter={() => setHoveredAttribute({ aptitude, attributeIndex: 0 })}
                          onMouseLeave={() => setHoveredAttribute(null)}
                        >
                          {hoveredAttribute?.aptitude === aptitude && hoveredAttribute?.attributeIndex === 0
                            ? `[6/10] ${Math.floor(state.attributes[atb1] * 6 / 10)}`
                            : getAttributeAbbreviation(atb1).toUpperCase()}
                        </div>
                        
                        {/* Attribute 2 - Aaa format (title case) */}
                        <div
                          className="font-medieval text-xs font-bold text-red-theme tracking-wide cursor-help"
                          onMouseEnter={() => setHoveredAttribute({ aptitude, attributeIndex: 1 })}
                          onMouseLeave={() => setHoveredAttribute(null)}
                        >
                          {hoveredAttribute?.aptitude === aptitude && hoveredAttribute?.attributeIndex === 1
                            ? `[3/10] ${Math.floor(state.attributes[atb2] * 3 / 10)}`
                            : getAttributeAbbreviation(atb2).charAt(0).toUpperCase() + getAttributeAbbreviation(atb2).slice(1).toLowerCase()}
                        </div>
                        
                        {/* Attribute 3 - aaa format (lowercase) */}
                        <div
                          className="font-medieval text-xs font-bold text-red-theme tracking-wide cursor-help"
                          onMouseEnter={() => setHoveredAttribute({ aptitude, attributeIndex: 2 })}
                          onMouseLeave={() => setHoveredAttribute(null)}
                        >
                          {hoveredAttribute?.aptitude === aptitude && hoveredAttribute?.attributeIndex === 2
                            ? `[1/10] ${Math.floor(state.attributes[atb3] * 1 / 10)}`
                            : getAttributeAbbreviation(atb3).toLowerCase()}
                        </div>
                      </div>
                    </div>

                    {/* Compétence de Résistance (R[Souffrance]) - Right under aptitude, above actions */}
                    {/* These are resistances compétences used to resist damage */}
                    <div className="mb-3 -mx-3">
                      {Object.values(Souffrance).map((souf) => {
                        const soufAttr = getSouffranceAttribute(souf);
                        if (soufAttr === atb1) {
                          const resistanceDegreeCount = manager.getResistanceDegreeCount(souf); // Resistance compétence degree count
                          const resistanceLevel = manager.getResistanceLevel(souf); // Resistance compétence level (separate from souffrance degrees)
                          const totalMarks = manager.getTotalSouffranceMarks(souf);
                          const isEprouvee = manager.isSouffranceEprouvee(souf);
                          const requiredResistanceMarks = MARKS_TO_EPROUVER - (state.souffrances[souf]?.eternalMarks ?? 0);
                          
                          return (
                            <div
                              key={souf}
                              data-sim-highlight={`resistance-${souf}`}
                              className={`text-xs bg-red-theme-alpha border-2 border-border-dark rounded p-2 ${isEprouvee ? 'overflow-visible' : ''} transition-all ${simHighlightId === `resistance-${souf}` ? 'tutorial-ring' : ''}`}
                              style={{
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                                ...(isEprouvee ? { overflow: 'visible', position: 'relative', zIndex: 1 } : {})
                              }}
                              title={simHighlightId === `resistance-${souf}` ? simTooltip ?? undefined : undefined}
                            >
                              <div className="font-bold text-text-cream mb-1 flex items-center gap-1">
                                <DegreeInput
                                  value={resistanceDegreeCount}
                                  onChange={(value) => {
                                    if (godMode) {
                                      manager.setResistanceDegreeCount(souf, value);
                                      updateState();
                                    }
                                  }}
                                  min={0}
                                  size="sm"
                                  disabled={!godMode}
                                />
                                <span>{getResistanceCompetenceName(souf)}</span>
                              </div>
                              <div className={`grid grid-cols-[1rem_1fr] items-center gap-1 ${isEprouvee ? 'overflow-visible' : ''}`} style={isEprouvee ? { overflow: 'visible' } : {}}>
                                <span className="text-xs font-medieval font-semibold text-text-cream whitespace-nowrap">N{resistanceLevel}</span>
                                <ProgressBar 
                                  value={totalMarks} 
                                  max={Math.max(1, requiredResistanceMarks)} 
                                  height="sm" 
                                  label={getLevelName(resistanceLevel)} 
                                  level={resistanceLevel}
                                  isFull={isEprouvee}
                                  showRealizeLabel={isEprouvee}
                                  onClick={() => {
                                    if (isEprouvee) {
                                      manager.realizeSouffrance(souf);
                                      updateState();
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>

                    {/* Actions (3 per Aptitude) */}
                    <div className="space-y-0" style={{ marginLeft: '-1.75rem', paddingLeft: '1.25rem' }}>
                      {actions.map((action, actionIdx) => {
                        const competences = getCompetencesForAction(action);
                        const isExpanded = expandedActions.has(action);
                        const linkedAttr = getActionLinkedAttribute(action);
                        
                        return (
                          <div key={action} className="relative">
                            {actionIdx > 0 && (
                              <div className="border-t border-border-tan my-1"></div>
                            )}
                            <div 
                              className="text-xs relative rounded-md px-2 py-1 my-1 overflow-hidden"
                              style={{
                                position: 'relative',
                              }}
                              onMouseEnter={() => setHoveredAction(action)}
                              onMouseLeave={() => setHoveredAction(null)}
                            >
                              {/* Main background with fade to transparent at edges */}
                              <div 
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  background: 'linear-gradient(to right, transparent 0%, rgba(221, 202, 146, 0.1) 15%, rgba(221, 202, 146, 0.15) 25%, rgba(221, 202, 146, 0.15) 75%, rgba(221, 202, 146, 0.1) 85%, transparent 100%)',
                                  pointerEvents: 'none',
                                  borderRadius: 'inherit',
                                }}
                              />
                              {/* Vertical fade overlay */}
                              <div 
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  background: 'linear-gradient(to bottom, transparent 0%, rgba(221, 202, 146, 0.1) 20%, rgba(221, 202, 146, 0.15) 40%, rgba(221, 202, 146, 0.15) 60%, rgba(221, 202, 146, 0.1) 80%, transparent 100%)',
                                  pointerEvents: 'none',
                                  borderRadius: 'inherit',
                                }}
                              />
                              <div style={{ position: 'relative', zIndex: 1 }}>
                              <ExpandableSection
                                isExpanded={isExpanded}
                                onToggle={() => toggleAction(action)}
                                title={
                                  <div className="flex items-center w-full" style={{ gap: 0, margin: 0, padding: 0 }}>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 'auto' }}>{getActionName(action).toUpperCase()}</span>
                                    <div style={{ position: 'relative', flexShrink: 0, marginLeft: 0 }}>
                                      {/* DegreeInput showing total compétence levels - always in layout to maintain height */}
                                      <div
                                        style={{
                                          opacity: hoveredAction === action ? 0 : 1,
                                          transition: 'opacity 0.3s ease-in-out',
                                          pointerEvents: hoveredAction === action ? 'none' : 'auto',
                                          position: 'relative',
                                          visibility: hoveredAction === action ? 'hidden' : 'visible',
                                        }}
                                      >
                                        <DegreeInput
                                          value={competences.reduce((sum, comp) => sum + manager.getCompetenceLevel(comp), 0)}
                                          onChange={() => {
                                            // Read-only - shows total compétence levels for this action
                                          }}
                                          min={0}
                                          size="sm"
                                          disabled={true}
                                        />
                                      </div>
                                      {/* [ATB] text that appears on hover */}
                                      <span 
                                        className="text-text-secondary"
                                        style={{
                                          opacity: hoveredAction === action ? 1 : 0,
                                          transition: 'opacity 0.3s ease-in-out',
                                          pointerEvents: hoveredAction === action ? 'auto' : 'none',
                                          position: 'absolute',
                                          right: 0,
                                          whiteSpace: 'nowrap',
                                          top: '50%',
                                          transform: 'translateY(-50%)',
                                        }}
                                      >
                                        [{getAttributeAbbreviation(linkedAttr)}]
                                      </span>
                                    </div>
                                  </div>
                                }
                                contentClassName="mt-1 space-y-0.5 pl-2 border-l-2 border-border-tan"
                              >
                              {competences.map((comp) => {
                                const compData = state.competences[comp];
                                const isCompExpanded = expandedCompetences.has(comp);
                                const level = manager.getCompetenceLevel(comp);
                                const totalMarks = manager.getTotalMarks(comp);
                                const isEprouvee = manager.isCompetenceEprouvee(comp);
                                
                                const isRevealStepUnrevealed = simHighlightId === 'create-reveal' && !compData.isRevealed;
                                return (
                                  <div
                                    key={comp}
                                    data-sim-highlight={`competence-${comp}`}
                                    className={`text-xs relative rounded transition-all ${simHighlightId === `competence-${comp}` ? 'tutorial-ring' : ''} ${isRevealStepUnrevealed ? 'tutorial-reveal-highlight' : ''}`}
                                    title={simHighlightId === `competence-${comp}` ? simTooltip ?? undefined : undefined}
                                  >
                                    {!compData.isRevealed ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (simHighlightId === 'create-reveal' && revealedCount >= MAX_REVEAL) return;
                                          revealCompetence(comp);
                                        }}
                                        disabled={simHighlightId === 'create-reveal' && revealedCount >= MAX_REVEAL}
                                        title={simHighlightId === 'create-reveal' && revealedCount >= MAX_REVEAL ? `Maximum ${MAX_REVEAL} compétences révélées` : undefined}
                                        onMouseEnter={() => setHoveredRevealCompetence(comp)}
                                        onMouseLeave={() => setHoveredRevealCompetence(null)}
                                        className="font-medieval text-xs font-semibold transition-all duration-300 cursor-pointer relative bg-transparent border-none p-0 m-0 w-full flex items-center disabled:opacity-60 disabled:cursor-not-allowed"
                                        style={{
                                          opacity: hoveredRevealCompetence === comp ? 1 : 0.5,
                                          color: hoveredRevealCompetence === comp ? '#4d3000' : '#72522f',
                                          transform: hoveredRevealCompetence === comp ? 'translateY(-2px)' : 'translateY(0)',
                                          zIndex: hoveredRevealCompetence === comp ? 10 : 'auto',
                                          textShadow: hoveredRevealCompetence === comp ? '0 0 8px #ffebc6, 0 0 12px #f5e6d3, 0 0 16px #e8d5b7' : 'none',
                                          animation: hoveredRevealCompetence === comp ? 'reveal-pulse 1.5s ease-in-out infinite' : 'none',
                                        }}
                                      >
                                        <span className="transition-all duration-300" style={{
                                          marginLeft: 'auto',
                                          marginRight: hoveredRevealCompetence === comp ? 'auto' : '0',
                                        }}>
                                          {hoveredRevealCompetence === comp ? `Révéler ${getCompetenceName(comp)} ?` : getCompetenceName(comp)}
                                        </span>
                                      </button>
                                    ) : (
                                      <>
                                        <div className="mb-1">
                                          <ExpandableSection
                                            isExpanded={isCompExpanded}
                                            onToggle={() => toggleCompetence(comp)}
                                            arrowPosition="right"
                                            title={
                                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                <div onClick={(e) => e.stopPropagation()}>
                                                  <DegreeInput
                                                    value={compData.degreeCount}
                                                    onChange={(value) => {
                                                      if (godMode) {
                                                        manager.setCompetenceDegree(comp, value);
                                                        updateState();
                                                      }
                                                    }}
                                                    min={0}
                                                    size="sm"
                                                    disabled={!godMode}
                                                  />
                                                </div>
                                                <span className="text-xs">{getCompetenceName(comp)}</span>
                                              </div>
                                            }
                                            headerFooter={
                                              <div className={`grid grid-cols-[1rem_1fr] items-center gap-1 ${manager.isCompetenceEprouvee(comp) ? 'overflow-visible' : ''}`} style={manager.isCompetenceEprouvee(comp) ? { overflow: 'visible' } : {}}>
                                                <span className="text-xs font-medieval font-semibold text-text-dark whitespace-nowrap">N{level}</span>
                                                <ProgressBar 
                                                  value={totalMarks} 
                                                  max={Math.max(1, MARKS_TO_EPROUVER - (compData.eternalMarks ?? 0))} 
                                                  height="sm" 
                                                  label={getLevelName(level)} 
                                                  level={level}
                                                  isFull={isEprouvee}
                                                  showRealizeLabel={isEprouvee}
                                                  onClick={() => {
                                                    if (isEprouvee) {
                                                      manager.realizeCompetence(comp);
                                                      updateState();
                                                    }
                                                  }}
                                                />
                                              </div>
                                            }
                                            headerClassName="mb-1"
                                            contentClassName="space-y-1"
                                          >
                                            {/* Masteries Section */}
                                            <div
                                              data-sim-highlight={`mastery-${comp}`}
                                              className={`space-y-1 mt-2 rounded transition-all ${simHighlightId === `mastery-${comp}` ? 'tutorial-ring' : ''}`}
                                              title={simHighlightId === `mastery-${comp}` ? simTooltip ?? undefined : undefined}
                                            >
                                              {/* Unlock button when there are existing masteries */}
                                              {compData.masteries.length > 0 && manager.getMasteryPoints(comp) > 0 && (() => {
                                                const availableMasteries = getMasteries(comp);
                                                const unlockedMasteryNames = compData.masteries.map(m => m.name);
                                                const unselectedMasteries = availableMasteries.filter(
                                                  masteryName => !unlockedMasteryNames.includes(masteryName)
                                                );
                                                const hasUnselectedMasteries = unselectedMasteries.length > 0;
                                                
                                                return (
                                                  <div className="flex items-center justify-between mb-2">
                                                    {hasUnselectedMasteries ? (
                                                      <span 
                                                        className="text-text-secondary italic text-xs cursor-pointer hover:text-text-dark transition-colors"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          const wasOpen = masterySelectionOpen === comp;
                                                          setMasterySelectionOpen(wasOpen ? null : comp);
                                                          
                                                          if (!wasOpen) {
                                                            const buttonEl = masteryButtonRefs.current.get(comp);
                                                            const rect = buttonEl ? buttonEl.getBoundingClientRect() : e.currentTarget.getBoundingClientRect();
                                                            setMasteryDropdownPosition({
                                                              top: rect.bottom + 4,
                                                              left: rect.left,
                                                              width: rect.width
                                                            });
                                                          } else {
                                                            setMasteryDropdownPosition(null);
                                                          }
                                                        }}
                                                      >
                                                        Apprendre Maîtrise
                                                      </span>
                                                    ) : (
                                                      <span className="text-text-secondary italic text-xs">Toutes connues</span>
                                                    )}
                                                    <button
                                                      ref={(el) => {
                                                        if (el) masteryButtonRefs.current.set(comp, el);
                                                        else masteryButtonRefs.current.delete(comp);
                                                      }}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        const wasOpen = masterySelectionOpen === comp;
                                                        setMasterySelectionOpen(wasOpen ? null : comp);
                                                        
                                                        if (!wasOpen) {
                                                          const buttonEl = masteryButtonRefs.current.get(comp);
                                                          if (buttonEl) {
                                                            const rect = buttonEl.getBoundingClientRect();
                                                            setMasteryDropdownPosition({
                                                              top: rect.bottom + 4,
                                                              left: rect.left,
                                                              width: rect.width
                                                            });
                                                          }
                                                        } else {
                                                          setMasteryDropdownPosition(null);
                                                        }
                                                      }}
                                                      className="px-2 py-1 bg-green-theme text-text-cream border border-border-dark rounded font-medieval font-semibold text-xs transition-all duration-300 hover:bg-hover-bg hover:text-text-dark cursor-pointer"
                                                      style={{
                                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                                                      }}
                                                    >
                                                      {manager.getMasteryPoints(comp)}
                                                    </button>
                                                  </div>
                                                );
                                              })()}
                                              
                                              {/* List of unlocked masteries */}
                                              {compData.masteries.length > 0 && (
                                                <div className="space-y-1 mb-2">
                                                  {compData.masteries.map((mastery, masteryIdx) => {
                                                    const maxDegree = level;
                                                    const canUpgrade = mastery.degreeCount < maxDegree && manager.getMasteryPoints(comp) > 0;
                                                    
                                                    return (
                                                      <div key={masteryIdx} className="text-xs flex items-center justify-between">
                                                        <span className="flex-1"><span className="mr-1">•</span>{mastery.name}</span>
                                                        <div className="flex items-center gap-1">
                                                          <span className="text-text-secondary text-xs">{mastery.degreeCount}°</span>
                                                          {canUpgrade && (
                                                            <Tooltip
                                                              content="Upgrade (+1 point)"
                                                              position="top"
                                                              delay={200}
                                                            >
                                                              <button
                                                                onClick={() => {
                                                                  manager.upgradeMastery(comp, mastery.name);
                                                                  updateState();
                                                                }}
                                                                className="px-2 py-1 bg-blue-600 text-white border border-border-dark rounded font-medieval font-semibold text-xs transition-all duration-300 hover:bg-hover-bg hover:text-text-dark"
                                                              >
                                                                +1
                                                              </button>
                                                            </Tooltip>
                                                          )}
                                                        </div>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              )}
                                              
                                              {/* Mastery selection dropdown - rendered via portal to escape overflow */}
                                              {masterySelectionOpen === comp && masteryDropdownPosition && typeof window !== 'undefined' && (() => {
                                                const availableMasteries = getMasteries(comp);
                                                const unlockedMasteryNames = compData.masteries.map(m => m.name);
                                                const unselectedMasteries = availableMasteries.filter(
                                                  masteryName => !unlockedMasteryNames.includes(masteryName)
                                                );
                                                
                                                if (import.meta.env.DEV) {
                                                  console.log('Mastery dropdown for', getCompetenceName(comp), {
                                                    available: availableMasteries.length,
                                                    unlocked: unlockedMasteryNames.length,
                                                    unselected: unselectedMasteries.length,
                                                    unselectedList: unselectedMasteries
                                                  });
                                                }
                                                
                                                return createPortal(
                                                  <div 
                                                    data-mastery-dropdown
                                                    className="fixed bg-parchment-dark border-2 border-gold-glow rounded shadow-2xl max-h-40 overflow-y-auto min-w-[200px] z-[10001]"
                                                    style={{
                                                      top: `${masteryDropdownPosition.top}px`,
                                                      left: `${masteryDropdownPosition.left}px`,
                                                      width: `${Math.max(masteryDropdownPosition.width, 200)}px`,
                                                      boxShadow: '0 0 0 1px #643030, 0 0 0 2px #ffebc6, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 0 0 1px #ceb68d'
                                                    }}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                  >
                                                    {unselectedMasteries.length > 0 ? (
                                                      unselectedMasteries.map((masteryName) => (
                                                        <button
                                                          key={masteryName}
                                                          type="button"
                                                          onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                          }}
                                                          onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            manager.unlockMastery(comp, masteryName);
                                                            if (import.meta.env.DEV) {
                                                              console.log('Unlock mastery:', {
                                                                competence: getCompetenceName(comp),
                                                                mastery: masteryName,
                                                                success: true,
                                                                pointsBefore: manager.getMasteryPoints(comp) + 1,
                                                                pointsAfter: manager.getMasteryPoints(comp)
                                                              });
                                                            }
                                                            updateState();
                                                            setMasterySelectionOpen(null);
                                                            setMasteryDropdownPosition(null);
                                                          }}
                                                          className="w-full px-2 py-2 text-xs text-left font-medieval text-text-dark block whitespace-nowrap transition-colors duration-300 hover:bg-hover-bg hover:text-red-theme border-b border-border-tan last:border-b-0"
                                                        >
                                                          {masteryName}
                                                        </button>
                                                      ))
                                                    ) : (
                                                      <div className="px-2 py-2 text-xs text-text-secondary italic">
                                                        {availableMasteries.length === 0 
                                                          ? 'Aucune maîtrise disponible' 
                                                          : 'Toutes les maîtrises sont débloquées'}
                                                      </div>
                                                    )}
                                                  </div>,
                                                  document.body
                                                );
                                              })()}
                                              
                                              {/* No masteries section */}
                                              {compData.masteries.length === 0 && (() => {
                                                const availableMasteries = getMasteries(comp);
                                                const unlockedMasteryNames = compData.masteries.map(m => m.name);
                                                const unselectedMasteries = availableMasteries.filter(
                                                  masteryName => !unlockedMasteryNames.includes(masteryName)
                                                );
                                                const hasUnselectedMasteries = unselectedMasteries.length > 0;
                                                
                                                return (
                                                  <div className="text-xs flex items-center justify-between">
                                                    {manager.getMasteryPoints(comp) > 0 ? (
                                                      <>
                                                        {hasUnselectedMasteries ? (
                                                          <span 
                                                            className="text-text-secondary italic cursor-pointer hover:text-text-dark transition-colors"
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              const wasOpen = masterySelectionOpen === comp;
                                                              setMasterySelectionOpen(wasOpen ? null : comp);
                                                              
                                                              if (!wasOpen) {
                                                                // Use button position for dropdown if available
                                                                const buttonEl = masteryButtonRefs.current.get(comp);
                                                                const rect = buttonEl ? buttonEl.getBoundingClientRect() : e.currentTarget.getBoundingClientRect();
                                                                setMasteryDropdownPosition({
                                                                  top: rect.bottom + 4,
                                                                  left: rect.left,
                                                                  width: rect.width
                                                                });
                                                              } else {
                                                                setMasteryDropdownPosition(null);
                                                              }
                                                            }}
                                                          >
                                                            Apprendre Maîtrise
                                                          </span>
                                                        ) : (
                                                          <span className="text-text-secondary italic">Toutes connues</span>
                                                        )}
                                                        <button
                                                          ref={(el) => {
                                                            if (el) masteryButtonRefs.current.set(comp, el);
                                                            else masteryButtonRefs.current.delete(comp);
                                                          }}
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            const wasOpen = masterySelectionOpen === comp;
                                                            setMasterySelectionOpen(wasOpen ? null : comp);
                                                            
                                                            if (!wasOpen) {
                                                              const buttonEl = masteryButtonRefs.current.get(comp);
                                                              if (buttonEl) {
                                                                const rect = buttonEl.getBoundingClientRect();
                                                                setMasteryDropdownPosition({
                                                                  top: rect.bottom + 4,
                                                                  left: rect.left,
                                                                  width: rect.width
                                                                });
                                                              }
                                                            } else {
                                                              setMasteryDropdownPosition(null);
                                                            }
                                                          }}
                                                          className="px-2 py-1 bg-green-theme text-text-cream border border-border-dark rounded font-medieval font-semibold text-xs transition-all duration-300 hover:bg-hover-bg hover:text-text-dark cursor-pointer"
                                                          style={{
                                                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                                                          }}
                                                        >
                                                          {manager.getMasteryPoints(comp)}
                                                        </button>
                                                      </>
                                                    ) : (
                                                      <span className="text-text-secondary italic">Aucune maîtrise</span>
                                                    )}
                                                  </div>
                                                );
                                              })()}
                                            </div>
                                          </ExpandableSection>
                                        </div>
                                        {/* Bottom border after each Compétence */}
                                        <div className="border-t border-border-tan mt-2 pt-2"></div>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                              </ExpandableSection>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                      </div>
                      
                      {/* Back Face */}
                      <div
                        className="absolute inset-0 bg-red-theme-alpha border-2 border-border-dark rounded-lg p-3"
                        style={{
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                          width: '100%',
                          minWidth: 0,
                        }}
                      >
                        {/* Aptitude Name - Same position, gold color */}
                        <div 
                          className="mb-2 pb-2 border-b-2 border-border-dark cursor-pointer"
                          onClick={() => toggleAptitudeFlip(aptitude)}
                          style={{ width: '100%', minWidth: 0 }}
                        >
                          <div className="font-medieval text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#ffebc6', width: '100%', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {getAptitudeName(aptitude)}
                          </div>
                        </div>
                        {/* Back content - you can add anything here */}
                        <div className="text-text-cream text-xs text-center">
                          {/* Add back side content here if needed */}
                        </div>
                      </div>
                    </div>
                  </div>
                );
                })}
              </div>
          </section>
        </div>
      </div>
    </div>
  );
}

