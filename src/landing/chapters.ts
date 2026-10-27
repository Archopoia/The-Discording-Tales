// @ts-nocheck
/**
 * Loads landing-cinema.json and binds chapter sections -> ScrollTrigger
 * waypoints. Each visible chapter exposes a 0..1 progress on the body as a
 * CSS variable (--chapter-<id>-p) and dispatches a document event so the
 * shader backdrop and fly-through can lerp uniforms toward chapter values.
 */
import { gsap, ScrollTrigger, type Conductor } from './conductor';

export interface ChapterShader {
  hueShift: number;
  grain: number;
  glow: number;
  flow: number;
}

export interface ChapterPalette {
  ink: string;
  accent: string;
  field: string;
}

export interface Waypoint {
  progress: number;
  texture: string;
  title: string;
  body: string;
}

export interface ChapterDef {
  id: string;
  scrollWeight: number;
  pin?: boolean;
  palette: ChapterPalette;
  shader: ChapterShader;
  parallax?: string[];
  waypoints?: Waypoint[];
  mobile?: Partial<ChapterDef> & { waypoints?: number };
}

export interface ChapterState {
  def: ChapterDef;
  progress: number;
  active: boolean;
}

export interface ChaptersResult {
  defs: Record<string, ChapterDef>;
  active: () => ChapterState | null;
  blend: () => { shader: ChapterShader; palette: ChapterPalette };
  getFlythrough: () => ChapterDef | null;
}

const DEFAULT_SHADER: ChapterShader = { hueShift: 0, grain: 0.4, glow: 0.5, flow: 0.3 };
const DEFAULT_PALETTE: ChapterPalette = { ink: '#f6edd4', accent: '#e4c56a', field: '#2a0d0d' };

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

export function bootChapters(conductor: Conductor, data: { chapters: ChapterDef[] }): ChaptersResult {

  const defs: Record<string, ChapterDef> = {};
  for (const c of data.chapters) defs[c.id] = c;

  const states: ChapterState[] = [];

  for (const def of data.chapters) {
    const el = document.querySelector<HTMLElement>(`[data-chapter="${def.id}"]`);
    if (!el) continue;

    // Apply chapter palette as CSS vars on the section itself.
    el.style.setProperty('--chapter-field', def.palette.field);
    el.style.setProperty('--chapter-ink', def.palette.ink);
    el.style.setProperty('--chapter-accent', def.palette.accent);

    const state: ChapterState = { def, progress: 0, active: false };
    states.push(state);

    ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        state.progress = self.progress;
        document.documentElement.style.setProperty(`--chapter-${def.id}-p`, self.progress.toFixed(3));
      },
      onEnter: () => { state.active = true; el.setAttribute('data-chapter-active', 'true'); },
      onEnterBack: () => { state.active = true; el.setAttribute('data-chapter-active', 'true'); },
      onLeave: () => { state.active = false; el.removeAttribute('data-chapter-active'); },
      onLeaveBack: () => { state.active = false; el.removeAttribute('data-chapter-active'); },
    });
  }

  function active(): ChapterState | null {
    // Prefer the chapter closest to viewport center.
    const vh = window.innerHeight;
    const cy = window.scrollY + vh * 0.5;
    let best: { s: ChapterState; d: number } | null = null;
    for (const s of states) {
      const el = document.querySelector<HTMLElement>(`[data-chapter="${s.def.id}"]`);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const mid = window.scrollY + rect.top + rect.height * 0.5;
      const d = Math.abs(cy - mid);
      if (!best || d < best.d) best = { s, d };
    }
    return best ? best.s : null;
  }

  // Blend between current chapter and the next one by section-local progress.
  function blend(): { shader: ChapterShader; palette: ChapterPalette } {
    const vh = window.innerHeight;
    const cy = window.scrollY + vh * 0.5;
    // Find the two chapters whose sections bracket viewport center.
    let prev: { s: ChapterState; mid: number } | null = null;
    let next: { s: ChapterState; mid: number } | null = null;
    for (const s of states) {
      const el = document.querySelector<HTMLElement>(`[data-chapter="${s.def.id}"]`);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const mid = window.scrollY + rect.top + rect.height * 0.5;
      if (mid <= cy) { if (!prev || mid > prev.mid) prev = { s, mid }; }
      else { if (!next || mid < next.mid) next = { s, mid }; }
    }
    const a = prev?.s.def ?? next?.s.def;
    const b = next?.s.def ?? prev?.s.def;
    if (!a || !b) return { shader: DEFAULT_SHADER, palette: DEFAULT_PALETTE };
    const span = Math.max(1, (next?.mid ?? cy) - (prev?.mid ?? cy));
    const t = span > 0 ? Math.min(1, Math.max(0, (cy - (prev?.mid ?? cy)) / span)) : 0;
    return {
      shader: {
        hueShift: lerp(a.shader.hueShift, b.shader.hueShift, t),
        grain: lerp(a.shader.grain, b.shader.grain, t),
        glow: lerp(a.shader.glow, b.shader.glow, t),
        flow: lerp(a.shader.flow, b.shader.flow, t),
      },
      palette: a.palette,
    };
  }

  function getFlythrough(): ChapterDef | null {
    const def = defs['flythrough'];
    if (!def) return null;
    if (conductor.isMobile && def.mobile) {
      const count = typeof def.mobile.waypoints === 'number'
        ? def.mobile.waypoints
        : def.waypoints?.length;
      const waypoints = def.waypoints?.slice(0, count ?? def.waypoints.length);
      return { ...def, pin: def.mobile.pin ?? def.pin, scrollWeight: def.mobile.scrollWeight ?? def.scrollWeight, waypoints };
    }
    return def;
  }

  return { defs, active, blend, getFlythrough };
}
