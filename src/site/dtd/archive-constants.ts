/** Lore/rules subtabs hidden when "archived" content is off */
export const ARCHIVED_SUBTABS: Record<string, string[]> = {
    lore: ['cosmology', 'world-context'],
    rules: ['character-creation', 'progression', 'combat', 'magic'],
};

export const FIRST_NON_ARCHIVED: Record<string, string> = {
    lore: 'cosmology',
    univers: 'peoples',
    rules: 'character-creation',
};
