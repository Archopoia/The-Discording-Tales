import type { CharacterSheetState } from '@/game/character/CharacterSheetManager';

export const SIMULATION_CACHE_KEY = 'drd_simulation_character';

/**
 * Load cached character state from sessionStorage for the simulation.
 * Returns null if none saved or parse fails.
 */
export function loadCachedCharacter(): CharacterSheetState | null {
  try {
    const raw = sessionStorage.getItem(SIMULATION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CharacterSheetState;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Save character state to sessionStorage for the simulation.
 * State must be JSON-serializable (e.g. from manager.getState()).
 */
export function saveCachedCharacter(state: CharacterSheetState): void {
  try {
    sessionStorage.setItem(SIMULATION_CACHE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota or storage errors
  }
}

/**
 * Clear the cached character from sessionStorage (e.g. when resetting to create a new character).
 */
export function clearCachedCharacter(): void {
  try {
    sessionStorage.removeItem(SIMULATION_CACHE_KEY);
  } catch {
    // Ignore storage errors
  }
}
