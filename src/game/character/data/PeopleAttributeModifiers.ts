/**
 * Attribute modifiers by People and Sex
 * Source: Attributs d'Origine, Peuple & Race (CSV)
 * ... = 0 (no modifier). Format: Male|Female or single value.
 */

import type { Attribute } from './AttributeData';
import { Attribute as Attr } from './AttributeData';

const ORDER: Attribute[] = [Attr.FOR, Attr.AGI, Attr.DEX, Attr.VIG, Attr.EMP, Attr.PER, Attr.CRE, Attr.VOL];

export type PeopleKey =
  | 'Aristois'
  | 'Griscribes'
  | 'Navillis'
  | 'Méridiens'
  | 'Haut-Ylfes'
  | 'Ylfes pâles'
  | 'Ylfes des lacs'
  | 'Iqqars'
  | 'Slaadéens'
  | 'Tchalkchaïs';

/** Peoples that have different male/female modifiers. */
export const PEOPLES_WITH_SEX_VARIANTS: PeopleKey[] = [
  'Aristois',
  'Griscribes',
  'Navillis',
  'Méridiens',
  'Haut-Ylfes',
  'Ylfes des lacs',
  'Tchalkchaïs',
];

export type Sex = 'male' | 'female';

/** Modifiers in Niv scale (×10 for sheet). FOR, AGI, DEX, VIG, EMP, PER, CRE, VOL. */
export type AttributeModifiers = Record<Attribute, number>;

/** People → Sex → modifiers (Niv scale: -6 to +6). */
export const PEOPLE_ATTRIBUTE_MODIFIERS: Record<
  PeopleKey,
  { male?: AttributeModifiers; female?: AttributeModifiers; /** When no sex split */ base?: AttributeModifiers }
> = {
  Aristois: {
    male: { [Attr.FOR]: -1, [Attr.AGI]: -1, [Attr.DEX]: -1, [Attr.VIG]: -1, [Attr.EMP]: 1, [Attr.PER]: 1, [Attr.CRE]: 0, [Attr.VOL]: 2 },
    female: { [Attr.FOR]: -3, [Attr.AGI]: 0, [Attr.DEX]: -1, [Attr.VIG]: -1, [Attr.EMP]: 3, [Attr.PER]: 2, [Attr.CRE]: -1, [Attr.VOL]: 0 },
  },
  Griscribes: {
    male: { [Attr.FOR]: 1, [Attr.AGI]: -2, [Attr.DEX]: -2, [Attr.VIG]: 1, [Attr.EMP]: 0, [Attr.PER]: 2, [Attr.CRE]: 0, [Attr.VOL]: 0 },
    female: { [Attr.FOR]: -1, [Attr.AGI]: -1, [Attr.DEX]: -2, [Attr.VIG]: 1, [Attr.EMP]: 2, [Attr.PER]: 3, [Attr.CRE]: -1, [Attr.VOL]: -1 },
  },
  Navillis: {
    male: { [Attr.FOR]: -3, [Attr.AGI]: 0, [Attr.DEX]: 1, [Attr.VIG]: 0, [Attr.EMP]: 2, [Attr.PER]: 0, [Attr.CRE]: 1, [Attr.VOL]: -1 },
    female: { [Attr.FOR]: -6, [Attr.AGI]: 1, [Attr.DEX]: 1, [Attr.VIG]: 0, [Attr.EMP]: 5, [Attr.PER]: 2, [Attr.CRE]: -1, [Attr.VOL]: -2 },
  },
  Méridiens: {
    male: { [Attr.FOR]: 0, [Attr.AGI]: 2, [Attr.DEX]: 0, [Attr.VIG]: 0, [Attr.EMP]: -2, [Attr.PER]: -1, [Attr.CRE]: 0, [Attr.VOL]: 1 },
    female: { [Attr.FOR]: -4, [Attr.AGI]: 3, [Attr.DEX]: 0, [Attr.VIG]: 0, [Attr.EMP]: 4, [Attr.PER]: 1, [Attr.CRE]: -2, [Attr.VOL]: -1 },
  },
  'Haut-Ylfes': {
    male: { [Attr.FOR]: 1, [Attr.AGI]: 1, [Attr.DEX]: 0, [Attr.VIG]: 0, [Attr.EMP]: -3, [Attr.PER]: -3, [Attr.CRE]: 3, [Attr.VOL]: 1 },
    female: { [Attr.FOR]: -1, [Attr.AGI]: 2, [Attr.DEX]: 0, [Attr.VIG]: 0, [Attr.EMP]: -1, [Attr.PER]: -2, [Attr.CRE]: 2, [Attr.VOL]: 0 },
  },
  'Ylfes pâles': {
    base: { [Attr.FOR]: -3, [Attr.AGI]: -1, [Attr.DEX]: 0, [Attr.VIG]: -1, [Attr.EMP]: -4, [Attr.PER]: 2, [Attr.CRE]: 2, [Attr.VOL]: 4 },
  },
  'Ylfes des lacs': {
    male: { [Attr.FOR]: 4, [Attr.AGI]: 0, [Attr.DEX]: -3, [Attr.VIG]: 0, [Attr.EMP]: -3, [Attr.PER]: -3, [Attr.CRE]: 4, [Attr.VOL]: 1 },
    female: { [Attr.FOR]: 2, [Attr.AGI]: 1, [Attr.DEX]: -3, [Attr.VIG]: 0, [Attr.EMP]: -1, [Attr.PER]: -2, [Attr.CRE]: 3, [Attr.VOL]: 0 },
  },
  Iqqars: {
    base: { [Attr.FOR]: -3, [Attr.AGI]: 2, [Attr.DEX]: 0, [Attr.VIG]: -1, [Attr.EMP]: 3, [Attr.PER]: 2, [Attr.CRE]: -1, [Attr.VOL]: -2 },
  },
  Slaadéens: {
    base: { [Attr.FOR]: 2, [Attr.AGI]: 0, [Attr.DEX]: -3, [Attr.VIG]: 1, [Attr.EMP]: 2, [Attr.PER]: -3, [Attr.CRE]: 0, [Attr.VOL]: 1 },
  },
  Tchalkchaïs: {
    male: { [Attr.FOR]: -2, [Attr.AGI]: -2, [Attr.DEX]: 3, [Attr.VIG]: 3, [Attr.EMP]: 3, [Attr.PER]: 3, [Attr.CRE]: -4, [Attr.VOL]: -4 },
    female: { [Attr.FOR]: -4, [Attr.AGI]: -1, [Attr.DEX]: 3, [Attr.VIG]: 3, [Attr.EMP]: 5, [Attr.PER]: 4, [Attr.CRE]: -5, [Attr.VOL]: -5 },
  },
};

/** Get modifiers for a People and optional sex. Returns null if peuple unknown. */
export function getPeopleModifiers(peuple: string, sex?: Sex): AttributeModifiers | null {
  const key = peuple.trim() as PeopleKey;
  const row = PEOPLE_ATTRIBUTE_MODIFIERS[key];
  if (!row) return null;
  if (row.base) return { ...row.base };
  if (sex === 'female' && row.female) return { ...row.female };
  if (row.male) return { ...row.male };
  return row.female ? { ...row.female } : null;
}

/** Convert Niv-scale modifiers to sheet scale (×10). */
export function toSheetScale(mods: AttributeModifiers): Record<Attribute, number> {
  const out = {} as Record<Attribute, number>;
  for (const attr of ORDER) {
    out[attr] = (mods[attr] ?? 0) * 10;
  }
  return out;
}

/** Get People base in sheet scale from character info. Returns null if peuple unknown or no modifiers. */
export function getPeopleBaseSheetScale(info: { peuple?: string; sex?: 'male' | 'female' } | null): Record<Attribute, number> | null {
  if (!info?.peuple) return null;
  const mods = getPeopleModifiers(info.peuple, info.sex);
  if (!mods) return null;
  return toSheetScale(mods);
}
