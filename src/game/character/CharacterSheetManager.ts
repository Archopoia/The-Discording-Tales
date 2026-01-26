import { Attribute } from './data/AttributeData';
import { Aptitude, getAptitudeAttributes } from './data/AptitudeData';
import { getActionLinkedAttribute } from './data/ActionData';
import { Competence, getCompetenceAction } from './data/CompetenceData';
import { Souffrance } from './data/SouffranceData';
import { getMasteries } from './data/MasteryRegistry';

/** TTRPG rule: 10 marks (minus eternal) to éprouver a compétence or resistance */
export const MARKS_TO_EPROUVER = 10;

/**
 * Character Sheet State Manager
 * Manages all character sheet data and calculations
 */

export interface CharacterSheetState {
  // Attributes (8)
  attributes: Record<Attribute, number>;
  
  // Aptitudes (8) - calculated from attributes
  aptitudeLevels: Record<Aptitude, number>;
  
  // Compétences (72) - compétences d'Action (action compétences used to act)
  // Degree count, marks, masteries
  competences: Record<Competence, CompetenceData>;
  
  // Souffrances (8) - accumulating DS (Degrees of Souffrance) at top of character sheet
  // Also contains resistance compétences (compétences de Résistance) R[Souffrance]
  souffrances: Record<Souffrance, SouffranceData>;
  
  // Experience system
  freeMarks: number;
}

export interface CompetenceData {
  degreeCount: number; // Degrees of the compétence (not "dice")
  isRevealed: boolean;
  marks: boolean[]; // MARKS_TO_EPROUVER (10) marks per TTRPG
  partialMarks: number; // Fractional marks (0.0-0.99, accumulates until >= 1.0, then converts to full mark)
  eternalMarks: number;
  eternalMarkIndices: number[];
  masteries: MasteryData[];
  masteryPoints: number; // MT points - earned when gaining non-Niv degrees (aside from first)
}

export interface MasteryData {
  name: string;
  degreeCount: number; // Degrees of the mastery (not "dice")
}

export interface SouffranceData {
  degreeCount: number; // Degrés de Souffrance (DS) - accumulates when damage is taken (on top of character sheet)
  resistanceDegreeCount: number; // Degrés de Résistance - compétence de Résistance, only increases when realized (clicked when full)
  marks: boolean[]; // MARKS_TO_EPROUVER (10) for resistance compétence
  eternalMarks: number;
  eternalMarkIndices: number[];
}

export class CharacterSheetManager {
  private state: CharacterSheetState;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): CharacterSheetState {
    // Initialize all attributes to 0
    const attributes: Record<Attribute, number> = {
      [Attribute.FOR]: 0,
      [Attribute.AGI]: 0,
      [Attribute.DEX]: 0,
      [Attribute.VIG]: 0,
      [Attribute.EMP]: 0,
      [Attribute.PER]: 0,
      [Attribute.CRE]: 0,
      [Attribute.VOL]: 0,
    };

    // Initialize aptitude levels (will be calculated)
    const aptitudeLevels: Record<Aptitude, number> = {
      [Aptitude.PUISSANCE]: 0,
      [Aptitude.AISANCE]: 0,
      [Aptitude.PRECISION]: 0,
      [Aptitude.ATHLETISME]: 0,
      [Aptitude.CHARISME]: 0,
      [Aptitude.DETECTION]: 0,
      [Aptitude.REFLEXION]: 0,
      [Aptitude.DOMINATION]: 0,
    };

    // Initialize all compétences d'Action (action compétences)
    const competences: Record<Competence, CompetenceData> = {} as Record<Competence, CompetenceData>;
    Object.values(Competence).forEach((comp) => {
      competences[comp] = {
        degreeCount: 0,
        isRevealed: false,
        marks: new Array(MARKS_TO_EPROUVER).fill(false),
        partialMarks: 0.0, // Fractional marks accumulator
        eternalMarks: 0,
        eternalMarkIndices: [],
        masteries: [],
        masteryPoints: 0, // Start with 0 mastery points
      };
    });

    // Initialize all souffrances (with their resistance compétences)
    const souffrances: Record<Souffrance, SouffranceData> = {} as Record<Souffrance, SouffranceData>;
    Object.values(Souffrance).forEach((souf) => {
      souffrances[souf] = {
        degreeCount: 0, // Souffrance degrees (DS) - accumulates from damage (on top of character sheet)
        resistanceDegreeCount: 0, // Resistance compétence degrees - compétence de Résistance, only increases on realization
        marks: new Array(MARKS_TO_EPROUVER).fill(false),
        eternalMarks: 0,
        eternalMarkIndices: [],
      };
    });

    return {
      attributes,
      aptitudeLevels,
      competences,
      souffrances,
      freeMarks: 0,
    };
  }

  getState(): CharacterSheetState {
    // Create new objects for nested structures to ensure React detects changes
    const competences: Record<Competence, CompetenceData> = {} as Record<Competence, CompetenceData>;
    Object.keys(this.state.competences).forEach((key) => {
      const comp = this.state.competences[key as Competence];
      competences[key as Competence] = {
        ...comp,
        masteries: [...comp.masteries],
        marks: [...comp.marks],
        partialMarks: comp.partialMarks, // Copy partial marks
        eternalMarkIndices: [...comp.eternalMarkIndices],
      };
    });
    
    const souffrances: Record<Souffrance, SouffranceData> = {} as Record<Souffrance, SouffranceData>;
    Object.keys(this.state.souffrances).forEach((key) => {
      const souf = this.state.souffrances[key as Souffrance];
      souffrances[key as Souffrance] = {
        ...souf,
        marks: [...souf.marks],
        eternalMarkIndices: [...souf.eternalMarkIndices],
      };
    });
    
    return {
      ...this.state,
      competences,
      souffrances,
      aptitudeLevels: { ...this.state.aptitudeLevels },
      attributes: { ...this.state.attributes },
    };
  }

  /**
   * Replace internal state with a deep clone of the given state (e.g. from cache).
   * Used by the simulation to hydrate from sessionStorage.
   */
  loadState(state: CharacterSheetState): void {
    const competences: Record<Competence, CompetenceData> = {} as Record<Competence, CompetenceData>;
    Object.keys(state.competences).forEach((key) => {
      const comp = state.competences[key as Competence];
      competences[key as Competence] = {
        ...comp,
        masteries: comp.masteries.map((m) => ({ ...m })),
        marks: [...(comp.marks || [])],
        eternalMarkIndices: [...(comp.eternalMarkIndices || [])],
      };
    });
    const souffrances: Record<Souffrance, SouffranceData> = {} as Record<Souffrance, SouffranceData>;
    Object.keys(state.souffrances).forEach((key) => {
      const souf = state.souffrances[key as Souffrance];
      souffrances[key as Souffrance] = {
        ...souf,
        marks: [...(souf.marks || [])],
        eternalMarkIndices: [...(souf.eternalMarkIndices || [])],
      };
    });
    this.state = {
      attributes: { ...state.attributes },
      aptitudeLevels: { ...state.aptitudeLevels },
      competences,
      souffrances,
      freeMarks: state.freeMarks ?? 0,
    };
  }

  setAttribute(attribute: Attribute, value: number): void {
    this.state.attributes[attribute] = Math.max(-50, Math.min(50, value));
    this.recalculateAptitudes();
  }

  getAttribute(attribute: Attribute): number {
    return this.state.attributes[attribute];
  }

  getAptitudeLevel(aptitude: Aptitude): number {
    return this.state.aptitudeLevels[aptitude];
  }

  private recalculateAptitudes(): void {
    // Simplified calculation - in full implementation, use AttributeCalculator
    // For now, use simple sum of weighted attributes
    Object.values(Aptitude).forEach((aptitude) => {
      const [atb1, atb2, atb3] = getAptitudeAttributes(aptitude);
      const atb1Value = this.state.attributes[atb1];
      const atb2Value = this.state.attributes[atb2];
      const atb3Value = this.state.attributes[atb3];
      
      // Helper function to calculate contribution with proper rounding
      // For positive: floor division (rounds down)
      // For negative: truncate towards zero (so -0.6 becomes 0, not -1)
      const calculateContribution = (value: number, divisor: number): number => {
        if (value >= 0) {
          return Math.floor(value / divisor);
        } else {
          return Math.ceil(value / divisor);
        }
      };
      
      // ATB+3 = 6/10: -/+1 every -/+1.667 (10/6)
      const atb3Contribution = calculateContribution(atb1Value, 10 / 6);
      // ATB+2 = 3/10: -/+1 every -/+3.333 (10/3)
      const atb2Contribution = calculateContribution(atb2Value, 10 / 3);
      // ATB+1 = 1/10: -/+1 every -/+10 (10/1)
      const atb1Contribution = calculateContribution(atb3Value, 10 / 1);
      
      this.state.aptitudeLevels[aptitude] = atb3Contribution + atb2Contribution + atb1Contribution;
    });
  }

  getCompetence(competence: Competence): CompetenceData {
    return { ...this.state.competences[competence] };
  }

  getCompetenceDegree(competence: Competence): number {
    return this.state.competences[competence].degreeCount;
  }

  setCompetenceDegree(competence: Competence, degreeCount: number): void {
    const comp = this.state.competences[competence];
    const oldDegreeCount = comp.degreeCount;
    const oldLevel = this.getCompetenceLevel(competence);
    
    comp.degreeCount = Math.max(0, degreeCount);
    
    // Check if we should earn a mastery point
    // Mastery points (MT) are earned at every non-Niv degree gained, aside from the first one
    if (degreeCount > oldDegreeCount) {
      const newLevel = this.getCompetenceLevel(competence);
      
      // Earn mastery point if:
      // 1. Level didn't change (non-Niv degree)
      // 2. It's not the first degree (oldDegreeCount > 0)
      if (newLevel === oldLevel && oldDegreeCount > 0) {
        comp.masteryPoints += 1;
      }
    }
  }

  // Legacy alias for backwards compatibility during migration
  setCompetenceDice(competence: Competence, degreeCount: number): void {
    this.setCompetenceDegree(competence, degreeCount);
  }

  revealCompetence(competence: Competence): void {
    this.state.competences[competence].isRevealed = true;
  }

  addCompetenceMark(competence: Competence, isEternal: boolean = false): void {
    const comp = this.state.competences[competence];
    for (let i = 0; i < MARKS_TO_EPROUVER; i++) {
      if (!comp.marks[i]) {
        comp.marks[i] = true;
        if (isEternal) {
          comp.eternalMarkIndices.push(i);
          comp.eternalMarks++;
        }
        return;
      }
    }
  }

  /**
   * Add fractional marks to a competence (for video game XP distribution)
   * When partial marks accumulate to >= 1.0, convert to full mark
   * @param competence The competence to add marks to
   * @param amount Fractional amount (e.g., 1.5, 0.5, 3.0)
   * @param isEternal Whether these are eternal marks
   */
  addPartialMarks(competence: Competence, amount: number, isEternal: boolean = false): void {
    const comp = this.state.competences[competence];
    
    // Add to partial marks accumulator
    comp.partialMarks += amount;
    
    // Convert full marks when partial >= 1.0
    while (comp.partialMarks >= 1.0) {
      comp.partialMarks -= 1.0;
      this.addCompetenceMark(competence, isEternal);
    }
  }

  /**
   * Get partial marks for a competence (for display)
   */
  getPartialMarks(competence: Competence): number {
    return this.state.competences[competence].partialMarks;
  }

  /**
   * Distribute XP marks across multiple competences (video game adaptation)
   * Rules:
   * - Maximum 3 marks per failure, distributed among active competences
   * - If 1 CT used: 3 marks to that CT
   * - If 2 CTs used: 1.5 marks each (3 marks total)
   * - If 3 CTs used: 1 mark each (3 marks total)
   * - If more than 3 CTs: prioritize those with lowest degree count
   * 
   * @param activeCompetences Array of competences that were active during the failure
   * @param failures Number of failures (will be multiplied by 3 for total marks)
   * @param isEternal Whether these are eternal marks
   */
  distributeMarksToActiveCompetences(
    activeCompetences: Competence[],
    failures: number,
    isEternal: boolean = false
  ): void {
    if (activeCompetences.length === 0) return;
    if (failures <= 0) return;

    // Sort by degree count (lowest first) for priority when more than 3 competences
    const sortedCompetences = [...activeCompetences].sort((a, b) => {
      return this.getCompetenceDegree(a) - this.getCompetenceDegree(b);
    });

    // Take up to 3 competences (prioritized by lowest degree)
    const selectedCompetences = sortedCompetences.slice(0, 3);
    const numCompetences = selectedCompetences.length;

    // Calculate marks per competence based on number of competences used
    let marksPerCompetence: number;
    if (numCompetences === 1) {
      marksPerCompetence = 3.0; // 3 marks for 1 CT
    } else if (numCompetences === 2) {
      marksPerCompetence = 1.5; // 1.5 marks each for 2 CTs
    } else {
      marksPerCompetence = 1.0; // 1 mark each for 3 CTs
    }

    // Distribute marks (multiplied by failures)
    const marksPerCompetenceTotal = marksPerCompetence * failures;

    selectedCompetences.forEach(competence => {
      this.addPartialMarks(competence, marksPerCompetenceTotal, isEternal);
    });
  }

  getCompetenceLevel(competence: Competence): number {
    const degreeCount = this.state.competences[competence].degreeCount;
    if (degreeCount === 0) return 0;
    if (degreeCount <= 2) return 1;
    if (degreeCount <= 5) return 2;
    if (degreeCount <= 9) return 3;
    if (degreeCount <= 14) return 4;
    return 5;
  }

  getTotalMarks(competence: Competence): number {
    return this.state.competences[competence].marks.filter(m => m).length;
  }

  /**
   * Check if compétence is éprouvée (10 marks total, minus eternal marks, per TTRPG)
   */
  isCompetenceEprouvee(competence: Competence): boolean {
    const comp = this.state.competences[competence];
    const totalMarks = this.getTotalMarks(competence);
    const requiredMarks = MARKS_TO_EPROUVER - comp.eternalMarks;
    return totalMarks >= requiredMarks;
  }

  realizeCompetence(competence: Competence): void {
    if (!this.isCompetenceEprouvee(competence)) return;
    
    const comp = this.state.competences[competence];
    const oldDegreeCount = comp.degreeCount;
    const oldLevel = this.getCompetenceLevel(competence);
    
    comp.degreeCount += 1;
    
    // Check if we should earn a mastery point
    // Mastery points (MT) are earned at every non-Niv degree gained, aside from the first one
    const newLevel = this.getCompetenceLevel(competence);
    if (newLevel === oldLevel && oldDegreeCount > 0) {
      comp.masteryPoints += 1;
    }
    
    // Clear non-eternal marks (per TTRPG: 10 marks to éprouver)
    for (let i = 0; i < MARKS_TO_EPROUVER; i++) {
      if (!comp.eternalMarkIndices.includes(i)) {
        comp.marks[i] = false;
      }
    }
    
    // +1 to linked attribute (TTRPG: "Réalisation → +1 à l'Attribut associé")
    const action = getCompetenceAction(competence);
    const linkedAttr = getActionLinkedAttribute(action);
    this.setAttribute(linkedAttr, this.getAttribute(linkedAttr) + 1);
    
    // Gain free marks = current level
    const level = this.getCompetenceLevel(competence);
    this.state.freeMarks += level;
  }

  getFreeMarks(): number {
    return this.state.freeMarks;
  }

  addFreeMarks(amount: number): void {
    this.state.freeMarks += amount;
  }

  spendFreeMarks(amount: number): boolean {
    if (this.state.freeMarks >= amount) {
      this.state.freeMarks -= amount;
      return true;
    }
    return false;
  }

  getSouffrance(souffrance: Souffrance): SouffranceData {
    return { ...this.state.souffrances[souffrance] };
  }

  setSouffranceDegree(souffrance: Souffrance, degreeCount: number): void {
    this.state.souffrances[souffrance].degreeCount = Math.max(0, degreeCount);
  }

  /**
   * Add DS (Degrees of Souffrance) to a souffrance (e.g. "you take N DS Blessures").
   */
  addSouffranceDegree(souffrance: Souffrance, delta: number): void {
    const souf = this.state.souffrances[souffrance];
    souf.degreeCount = Math.max(0, souf.degreeCount + delta);
  }

  // Legacy alias for backwards compatibility during migration
  setSouffranceDice(souffrance: Souffrance, degreeCount: number): void {
    this.setSouffranceDegree(souffrance, degreeCount);
  }

  /**
   * Add a mark to a souffrance resistance compétence (compétence de Résistance)
   * These are the R[Souffrance] compétences used to resist damage
   */
  addSouffranceMark(souffrance: Souffrance, isEternal: boolean = false): void {
    const souf = this.state.souffrances[souffrance];
    for (let i = 0; i < MARKS_TO_EPROUVER; i++) {
      if (!souf.marks[i]) {
        souf.marks[i] = true;
        if (isEternal) {
          souf.eternalMarkIndices.push(i);
          souf.eternalMarks++;
        }
        return;
      }
    }
  }

  /**
   * Get total marks for a souffrance resistance compétence
   */
  getTotalSouffranceMarks(souffrance: Souffrance): number {
    return this.state.souffrances[souffrance].marks.filter(m => m).length;
  }

  /**
   * Get souffrance level (Niv 0-5) based on degree count
   * Same calculation as compétence level
   * This is the level of the DS (Degrees of Souffrance) accumulated on top of character sheet
   */
  getSouffranceLevel(souffrance: Souffrance): number {
    const degreeCount = this.state.souffrances[souffrance].degreeCount;
    if (degreeCount === 0) return 0;
    if (degreeCount <= 2) return 1;
    if (degreeCount <= 5) return 2;
    if (degreeCount <= 9) return 3;
    if (degreeCount <= 14) return 4;
    return 5;
  }

  /**
   * Get resistance compétence degree count (compétence de Résistance R[Souffrance])
   * This is separate from souffrance degree count - only increases on realization
   */
  getResistanceDegreeCount(souffrance: Souffrance): number {
    return this.state.souffrances[souffrance].resistanceDegreeCount;
  }

  // Legacy alias for backwards compatibility during migration
  getResistanceDiceCount(souffrance: Souffrance): number {
    return this.getResistanceDegreeCount(souffrance);
  }

  /**
   * Set resistance compétence degree count (normally only editable in God mode)
   * This is separate from souffrance degree count - only increases on realization normally
   */
  setResistanceDegreeCount(souffrance: Souffrance, degreeCount: number): void {
    this.state.souffrances[souffrance].resistanceDegreeCount = Math.max(0, degreeCount);
  }

  // Legacy alias for backwards compatibility during migration
  setResistanceDiceCount(souffrance: Souffrance, degreeCount: number): void {
    this.setResistanceDegreeCount(souffrance, degreeCount);
  }

  /**
   * Get resistance compétence level (Niv 0-5) based on resistance degree count
   * This is separate from souffrance degree count - only increases on realization
   * This is the level of the compétence de Résistance R[Souffrance]
   */
  getResistanceLevel(souffrance: Souffrance): number {
    const degreeCount = this.state.souffrances[souffrance].resistanceDegreeCount;
    if (degreeCount === 0) return 0;
    if (degreeCount <= 2) return 1;
    if (degreeCount <= 5) return 2;
    if (degreeCount <= 9) return 3;
    if (degreeCount <= 14) return 4;
    return 5;
  }

  /**
   * Check if souffrance resistance compétence is éprouvée (10 marks total, minus eternal marks, per TTRPG)
   */
  isSouffranceEprouvee(souffrance: Souffrance): boolean {
    const souf = this.state.souffrances[souffrance];
    const totalMarks = this.getTotalSouffranceMarks(souffrance);
    const requiredMarks = MARKS_TO_EPROUVER - souf.eternalMarks;
    return totalMarks >= requiredMarks;
  }

  /**
   * Realize a souffrance resistance compétence (gain +1 resistance degree when 10 marks reached, per TTRPG).
   * This increases the resistance compétence degree, NOT the souffrance degree.
   */
  realizeSouffrance(souffrance: Souffrance): void {
    if (!this.isSouffranceEprouvee(souffrance)) return;
    
    const souf = this.state.souffrances[souffrance];
    
    // +1 degree to resistance compétence (NOT souffrance degree)
    souf.resistanceDegreeCount += 1;
    
    // Clear non-eternal marks
    for (let i = 0; i < MARKS_TO_EPROUVER; i++) {
      if (!souf.eternalMarkIndices.includes(i)) {
        souf.marks[i] = false;
      }
    }
    
    // Gain free marks = current resistance level (same as compétence realization)
    const level = this.getResistanceLevel(souffrance);
    this.state.freeMarks += level;
  }

  /**
   * Get mastery points (MT) for a competence
   */
  getMasteryPoints(competence: Competence): number {
    return this.state.competences[competence].masteryPoints;
  }

  /**
   * Unlock a mastery by spending a mastery point
   * Unlocks with +1 degree automatically
   * @param competence The compétence
   * @param masteryName The name of the mastery to unlock
   * @returns true if successful, false if insufficient points or invalid mastery
   */
  unlockMastery(competence: Competence, masteryName: string): boolean {
    const comp = this.state.competences[competence];
    
    // Check if we have mastery points available
    if (comp.masteryPoints <= 0) {
      if (import.meta.env.DEV) {
        console.warn('Cannot unlock mastery: No mastery points available', {
          competence,
          masteryName,
          points: comp.masteryPoints
        });
      }
      return false;
    }
    
    // Verify the mastery is valid for this compétence
    const availableMasteries = getMasteries(competence);
    if (!availableMasteries.includes(masteryName)) {
      if (import.meta.env.DEV) {
        console.warn('Cannot unlock mastery: Invalid mastery for compétence', {
          competence,
          masteryName,
          available: availableMasteries
        });
      }
      return false;
    }
    
    // Check if this mastery is already unlocked
    if (comp.masteries.some(m => m.name === masteryName)) {
      if (import.meta.env.DEV) {
        console.warn('Cannot unlock mastery: Already unlocked', {
          competence,
          masteryName,
          unlocked: comp.masteries.map(m => m.name)
        });
      }
      return false;
    }
    
    // Create a new compétence object with updated masteries and points
    // This ensures React detects the change
    this.state.competences[competence] = {
      ...comp,
      masteryPoints: comp.masteryPoints - 1,
      masteries: [...comp.masteries, {
        name: masteryName,
        degreeCount: 1, // Start with +1 degree when unlocked
      }]
    };
    
    if (import.meta.env.DEV) {
      console.log('Mastery unlocked successfully', {
        competence,
        masteryName,
        remainingPoints: this.state.competences[competence].masteryPoints,
        totalMasteries: this.state.competences[competence].masteries.length
      });
    }
    
    return true;
  }

  /**
   * Upgrade an existing mastery by spending a mastery point
   * Increases the mastery's degree count by 1 (up to compétence level)
   * @param competence The compétence
   * @param masteryName The name of the mastery to upgrade
   * @returns true if successful, false if insufficient points or invalid mastery
   */
  upgradeMastery(competence: Competence, masteryName: string): boolean {
    const comp = this.state.competences[competence];
    
    // Check if we have mastery points available
    if (comp.masteryPoints <= 0) {
      return false;
    }
    
    // Find the mastery
    const mastery = comp.masteries.find(m => m.name === masteryName);
    if (!mastery) {
      return false;
    }
    
    // Check if we can upgrade (degree count must be less than compétence level)
    const maxDegree = this.getCompetenceLevel(competence);
    if (mastery.degreeCount >= maxDegree) {
      return false;
    }
    
    // Spend a mastery point and increase degree count
    comp.masteryPoints -= 1;
    mastery.degreeCount += 1;
    
    return true;
  }

  /**
   * Remove a mastery (refund the mastery point)
   * @param competence The competence
   * @param masteryName The name of the mastery to remove
   */
  removeMastery(competence: Competence, masteryName: string): boolean {
    const comp = this.state.competences[competence];
    const index = comp.masteries.findIndex(m => m.name === masteryName);
    
    if (index === -1) {
      return false;
    }
    
    // Remove the mastery and refund the point
    comp.masteries.splice(index, 1);
    comp.masteryPoints += 1;
    
    return true;
  }
}

