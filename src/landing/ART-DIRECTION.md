# /landing/ art direction (locked)

Lives next to the code it governs. Follow before touching chrome.

## Keep from existing school

- Display: `Quintessential, Palatino, Palatino Linotype, Georgia, serif`
- Body: `Fanwood Text, Georgia, Times New Roman, serif`
- Palette tokens (from `landing.template.html` `:root`): `--ink #f6edd4`, `--ink-soft #e4d5b8`, `--muted #c4b59a`, `--gold #e4c56a`, `--gold-deep #c9a227`, `--burgundy #3a1010`, `--burgundy-deep #240a0a`
- Theme color: `#5a1f1f`
- Tagline voice: "A world that doesn't wait for you"
- Bilingual title treatment: EN primary, FR as subtitle in letterspaced small caps
- Discreet ornament unit (gold hairline + rotated square) as rare divider only

## Modernize

- Full-bleed hero on a shader-painted field, not an inset `.plate` card
- Asymmetric chapter composition: large display headlines, left-aligned body, generous negative space
- Depth from a persistent shader plane + parallax art planes, not bordered plates everywhere
- Slim single-row topbar; progressive density on scroll
- Chapter marks only where they add rhythm; drop `01/02/03` on every section
- No facts strip above the fold; CTA ladder earns the viewport
- Gold used as *scarce* accent (CTA, chapter rule, overlay bar), not every heading tint

## Argument sheet (claims before chrome)

| # | Claim | Proof on page | CTA job |
|---|-------|---------------|---------|
| 1 | This world is alien, playable, and already real | 90s showcase + short world beats | Watch |
| 2 | The IP is dual-format and already shipped depth | Origin (book 5+ years, game launches) | Discord / Full site |
| 3 | Credible team is building it | Filterable roster + Wayward credit | Contact |
| 4 | You can evaluate seriously | Pitch deck PDF | View / download deck |

## CTA ladder (repeat at decision points)

1. Watch the showcase (hero, repeated after fly-through)
2. Join Discord (hero secondary, close block)
3. View the deck (origin close, close block)
4. Contact / Full site (exits only)

## Act beats

1. Preloader - real work, 2 to 3s, curtain lift
2. Hero - brand lockup over shader; tagline; CTA ladder; one micro-interaction
3. Showcase - pinned watchable stage, overlay captions during pin, native controls for playback
4. World without wiki dump - 2 to 3 claim beats, chapter palette shifts, parallax art planes (no three identical cards)
5. Signature - pinned Three.js camera path through peoples / areas / map textures, waypoint overlays with one headline each
6. Origin - dual-path book vs game, once-reveal
7. Team - quiet roster + craft filters
8. Payoff - deck + Discord + contact, hero-intensity CTA cluster that echoes the tagline

## Hard rules (ship gate)

- No em dash (project rule); use spaced hyphen
- No purple / aurora mesh / glassmorphism / three identical card grid / uniform fade-up (anti-ai-slop)
- No fake metrics; no unbuilt franchise SKUs on the page
- `prefers-reduced-motion`: no Lenis, no pins, static shader frame, poster for video, fly-through midpoint still
- Mobile <= 768px: no GSAP pin; CSS sticky + IntersectionObserver; WebGL `reduced` tier or static poster
- Pause WebGL when `document.hidden`; one `gsap.ticker` as the only animation clock
- Preserve existing SEO: title, description, OG/Twitter, VideoObject JSON-LD
