---
name: Character creation parity
overview: Align the character creation tutorial (website + chatbot + sheet) with the official DRD system from reference/TTRPG_DRD (02_Creation_Personnage, 04_Experience_Progression, 12_Peuples_Races, AllBookTables). Fix numeric constants, options, peoples list, and document or adjust simplified steps so they match or are explicitly documented as quick-start simplifications.
todos: []
isProject: false
---

# Character Creation Parity With Reference System

## Current vs reference (summary)

| Area | Reference (02, 04, 12, Quick Start) | Current implementation |
|------|-------------------------------------|-------------------------|
| **Attributes** | "Variabilité équilibrée": **sum = 0**; "sans dés": **+2,+1,0,0,0,0,-1,-2**; "Variabilité contrôlée": **20dD** for degrees (cost table [Niv_Atb_Coût_en_Degrés_Coût_Total.csv](reference/TTRPG_DRD/AllBookTables-csv/Niv_Atb_Coût_en_Degrés_Coût_Total.csv)) | **18 points** to add across 8 attributes ([SimulationEventLog.tsx](src/components/SimulationEventLog.tsx) `POOL_ATTRIBUTE_POINTS = 18`) |
| **Reveal count** | Éducation: **10 Dés Éduqués** (3×+1, 2×+2, 1×+3 by Peuple/Race/Familiale); Expression: **10 Dés Exprimés**. Not a "choose 3–5 skills" step | **3–5** competences to reveal ([SimulationEventLog.tsx](src/components/SimulationEventLog.tsx) `MIN_REVEAL = 3`, `MAX_REVEAL = 5`) |
| **Dice pool** | **10 Dés Éduqués** (pre-assigned) + **10 Dés Exprimés** (player) = 20 dice at creation | **10** dice total (competences + resistances) ([SimulationEventLog.tsx](src/components/SimulationEventLog.tsx) `POOL_DICE = 10`) |
| **Peoples (UI)** | **10** peoples by Origine (Yômmes: Aristois, Griscribes, Navillis, Méridiens; Yôrres: Hauts Ylfes, Ylfes pâles, Ylfes des lacs, Iqqars; Bêstres: Slaadéens, Tchalkchaïs) — [12_Peuples_Races.md](reference/TTRPG_DRD/System_Summary/12_Peuples_Races.md) | [index.html](index.html) "Character Creation" lists **4** (Aristois, Griscribes, Slaadéens, Tchalkchaïs); backend has all 10 |
| **Origine** | Yômmes, Yôrres, Bêstres then Peuple | Backend has Origine → Peuple; index.html does not mention Origine |
| **Resistance at creation** | No rule for assigning resistance degrees at creation; resistances grow in play | 10-dice pool includes **resistance degrees** (same pool as competence dice) |
| **MARKS_TO_EPROUVER** | 10 (04: "10 Marques (moins les Marques Éternelles)") | 10 in [CharacterSheetManager.ts](src/game/character/CharacterSheetManager.ts) and [gm-chat.js](js/gm-chat.js) — **correct** |

Backend creation prompt ([backend/main.py](backend/main.py) `GM_CREATION_PROMPT`) already uses: Origine (Yômmes, Yôrres, Bêstres), 10 peuples by Origine, attributes sum 18, 3–5 revealed, 10 dice, and valid competence keys.

---

## 1. Attributes step: align with book or document

**Reference:** [02_Creation_Personnage.md](reference/TTRPG_DRD/System_Summary/02_Creation_Personnage.md) B) Individuation:

- **Variabilité équilibrée:** total of 8 attributes = **0** (or group value).
- **Alternative sans dés:** apply **+2, +1, 0, 0, 0, 0, -1, -2** (one +2, one -2, one +1, one -1, four 0).

**Options:**

- **A) Full parity (recommended for "quick start" feel):** Change to **sum = 0** and enforce the single allowed spread: +2, +1, 0, 0, 0, 0, -1, -2 (each assigned to exactly one attribute). UI: either 8 dropdowns (choose which attribute gets +2, which gets +1, etc.) or keep 8 boxes but validate sum === 0 and that the multiset of values is exactly {+2,+1,0,0,0,0,-1,-2}. Update [SimulationEventLog.tsx](src/components/SimulationEventLog.tsx) (remove `POOL_ATTRIBUTE_POINTS`, add sum === 0 + spread validation), [CharacterSheet.tsx](src/components/CharacterSheet.tsx) (attribute inputs/validation), and [backend/main.py](backend/main.py) (StateJSON: attributes sum 0, same spread).
- **REJECTED: B) Keep 18 as house rule:** Leave mechanics as-is; add a short note in [index.html](index.html) Character Creation and in backend prompt: "Simplified: 18 points to distribute (house rule); full rules use sum = 0 or 20dD."

Implement A

---

## 2. Reveal count (3–5) and dice pool (10)

**Reference:** [04_Experience_Progression.md](reference/TTRPG_DRD/System_Summary/04_Experience_Progression.md) — 10 Dés Éduqués (assigned by Peuple/Race/Compétence Familiale) + 10 Dés Exprimés (player assigns).

- **Reveal:** Book does not say "choose 3–5 skills"; it fixes Éducation then lets player assign 10 Dés Exprimés. Keeping **3–5 revealed** is a reasonable simplification for a quick creation flow; no code change required if you document it.
- **Dice pool:** Book has **20** creation dice (10 Éduqués + 10 Exprimés). App uses **10** total. Either:
- **Option A:** Increase to **20** and split: e.g. "10 dice from Éducation (assigned by Peuple/Race/Familiale)" + "10 dice to distribute from Vécu (Exprimés)". This requires Peuple/Race and Compétence Familiale to drive the first 10 (logic from [12_Peuples_Races.md](reference/TTRPG_DRD/System_Summary/12_Peuples_Races.md) and Dispositions/CSVs).
- **Option B:** Keep 10 and document: "Simplified: 10 dice to distribute (Exprimés only); full rules also give 10 Éduqués by Peuple/Race/Familiale."

Implement option B. Recommend **Option B** unless you want to implement Peuple/Race/Familiale tables. In both cases, update [index.html](index.html) and/or tooltips in [characterSheetI18n.ts](src/lib/characterSheetI18n.ts) so the walkthrough text matches what the app does (e.g. "Distribute 10 dice across your revealed skills" and, if applicable, "Simplified: Éducation dice not applied here").

---

## 3. Peoples and Origine in the website walkthrough

**Reference:** [12_Peuples_Races.md](reference/TTRPG_DRD/System_Summary/12_Peuples_Races.md) — 3 Origines, 10 Peuples.

- **index.html** ([index.html](index.html) "#character-creation"): Currently lists 4 peoples. Add the full 10, grouped by Origine (e.g. "Yômmes: Aristois, Griscribes, Navillis, Méridiens; Yôrres: Hauts Ylfes, Ylfes pâles, Ylfes des lacs, Iqqars; Bêstres: Slaadéens, Tchalkchaïs"), so the static walkthrough matches the chatbot and the book.
- Add **Origine** before Peuple in the written steps (1. Choose Origine: Yômmes / Yôrres / Bêstres; 2. Choose a People within that Origine) so the page matches the backend flow.

No backend change needed; backend already has Origine → Peuple and all 10.

---

## 4. Numbers and wording in index.html

- **Base attributes:** If you keep 18 points, say so explicitly ("18 points to add across the 8 attributes"). If you switch to book parity (sum 0, +2,+1,0,0,0,0,-1,-2), replace with: "Apply +2, +1, 0, 0, 0, 0, -1, -2 to the 8 attributes (each value once)." as such we should have the actual numbers we can drag and drop to the relevant attribut input fields to apply them as such
- **Step 3 (skill):** Book says one Compétence Familiale at **+3 Dés**; then 10 Dés Exprimés. If the app stays with "3–5 skills + 10 dice", wording should say you **reveal 3–5 skills** and **distribute 10 dice** among them (and optionally resistances if you keep that).
- **Step 5 (Value):** Book: "+6 Dés" for a Value (e.g. Moralité). index.html already says "+6 Dice" — keep as-is.

---

## 5. Backend prompt (main.py)

- If attributes change to sum 0 and +2,+1,0,0,0,0,-1,-2: update `GM_CREATION_PROMPT` and StateJSON description (attributes sum 0; valid values exactly that multiset).
- If dice pool is competence-only: StateJSON can say "degrees: only competence keys; sum 10" 

---

## Implementation order (suggested)

1. **Documentation / wording:** Update [index.html](index.html) Character Creation: add Origine, all 10 peoples, and accurate numbers/wording for attributes and dice (and note any simplifications).
2. **Attributes:** Implement either sum=0 + spread (parity)
3. **Dice pool:** Decide: 10 (competence + resistance) vs 20 (Éduqués + Exprimés). Then implement and adjust tooltips/i18n.

---

## Files to touch

- [index.html](index.html) — Character Creation section (Origine, 10 peoples, numbers, wording).
- [src/components/SimulationEventLog.tsx](src/components/SimulationEventLog.tsx) — `POOL_ATTRIBUTE_POINTS` (or remove), `POOL_DICE`, dice sum = competence-only if applicable.
- [src/components/CharacterSheet.tsx](src/components/CharacterSheet.tsx) — Attribute validation (sum 0 + spread or 18), dice max/validation for creation.
- [src/lib/characterSheetI18n.ts](src/lib/characterSheetI18n.ts) — Tooltips for attributes and dice (exact numbers, optional "simplified" note).
- [backend/main.py](backend/main.py) — `GM_CREATION_PROMPT` and StateJSON (attributes, degrees, resistance if removed).

No change needed for MARKS_TO_EPROUVER (10) or Souffrance thresholds (10+ / 15+ / 21+); they already match the reference.