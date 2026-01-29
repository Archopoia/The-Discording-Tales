---
name: Character creation via chatbot
overview: "Integrate the character creation tutorial into the GM chatbot: when no character exists, show a \"Create a character\" button instead of the text input; clicking it starts a guided creation flow in the chat with parseable choice buttons and text inputs; at completion, build CharacterSheetState, save to sessionStorage, and notify the character sheet to load the new character. Backend gets a creation mode with a dedicated system prompt and structured output format; frontend parses assistant messages for [Choice]/[Option]/[Input]/[Complete] and injects interactive UI into the chat."
todos: []
isProject: false
---

# Character creation via chatbot and feed into character sheet

## Goal

- When the player has **no character**: replace the chat text input with a **"Create a character"** button that starts character creation through the chatbot.
- Run the **full character creation tutorial** inside the chat: guided steps with **buttons and answer inputs** in the chat (maximum interaction), plus optional free text.
- At the end of creation: **build** the character sheet state, **save** it (sessionStorage), and **notify** the character sheet so it loads the new character and the Play tab switches to normal chat input.

## Current state

- **Play tab** ([index.html](index.html) ~358–369): `.gm-chat-input-wrap` contains checkbox "Use current character" and `.gm-chat-input-row` (input + Send). No conditional "no character" UI.
- **GM chat** ([js/gm-chat.js](js/gm-chat.js)): Sends `messages` + optional `characterSnapshot` (from `sessionStorage.getItem(CHAR_STORAGE_KEY)` = `drd_simulation_character`). No creation mode; no parsing of structured blocks.
- **Backend** ([backend/main.py](backend/main.py)): `ChatRequest`: `messages`, `characterSnapshot`, `gameState`. Single system prompt (GM play). No creation-mode prompt or structured output.
- **Character sheet** ([src/components/CharacterSheet.tsx](src/components/CharacterSheet.tsx), [src/lib/simulationStorage.ts](src/lib/simulationStorage.ts)): Loads from `loadCachedCharacter()` (sessionStorage); `saveCachedCharacter(state)`; `CharacterSheetManager.loadState(state)`. No listener for "character created elsewhere".
- **Creation rules** ([reference/.../systeme_drd/02_Creation_Personnage.md](reference/TTRPG - Des Récits Discordants/systeme_drd/02_Creation_Personnage.md)): Amnésique (progressive) vs Complète; steps: Origine, Peuple, Race, Sexe, physical 10dD; Individuation (attributes); Récit; Dés Éduqués/Exprimés; Symbole, Valeurs, Traits, Titre; Langues; Richesses.
- **Existing in-app creation** ([src/components/SimulationEventLog.tsx](src/components/SimulationEventLog.tsx)): Simplified flow: 18 attribute points, 3–5 revealed competences, 10 dice to competences; saves via `saveCachedCharacter(manager.getState())`. Same state shape as [CharacterSheetManager](src/game/character/CharacterSheetManager.ts): `attributes`, `aptitudeLevels`, `competences`, `souffrances`, `freeMarks`.

## Architecture

```mermaid
sequenceDiagram
  participant User
  participant PlayTab
  participant GMChat
  participant Backend
  participant SessionStorage
  participant CharacterSheet

  User->>PlayTab: Opens Play tab
  PlayTab->>SessionStorage: getItem(drd_simulation_character)
  alt No character
    PlayTab->>User: Show "Create a character" button only
    User->>PlayTab: Clicks button
    PlayTab->>GMChat: creationMode = true, show input row
    PlayTab->>Backend: POST /chat/stream { creationMode: true, messages: [...] }
    Backend->>GMChat: Stream reply with [Choice]/[Option] or [Input] or [Complete]
    GMChat->>PlayTab: Parse and render buttons/inputs below message
    User->>PlayTab: Clicks option or submits input
    PlayTab->>Backend: Next message (choice text or structured)
    loop Until [Complete]
      Backend->>GMChat: Next step or [Complete] [+ optional StateJSON]
    end
    GMChat->>GMChat: Build CharacterSheetState from StateJSON or collected answers
    GMChat->>SessionStorage: saveCachedCharacter(state)
    GMChat->>CharacterSheet: dispatch('drd-character-created')
    CharacterSheet->>SessionStorage: loadCachedCharacter()
    CharacterSheet->>CharacterSheet: manager.loadState(cached); updateState()
    PlayTab->>User: Show normal input (character exists)
  else Character exists
    PlayTab->>User: Show checkbox + input row (current behavior)
  end
```

## 1. Backend: creation mode and structured output

**File**: [backend/main.py](backend/main.py)

- **Request**: Extend `ChatRequest` with optional `creation_mode: bool = False`. When `True`, use a different system prompt and (if needed) different RAG query or static rules.
- **System prompt for creation**: Add `GM_CREATION_PROMPT` (or build from RAG with 02_Creation_Personnage.md) that:
  - Instructs the model to act as the **character creation guide** (Éveilleur) and follow [02_Creation_Personnage.md](reference/TTRPG - Des Récits Discordants/systeme_drd/02_Creation_Personnage.md).
  - Defines a **strict output format** so the frontend can parse:
    - **Single choice**: One line `[Choice id=<id>] <prompt text>`. Then one line per option: `[Option <label>]` (e.g. `[Option Yômmes]`).
    - **Free text input**: One line `[Input id=<id>] <prompt text>`.
    - **End of creation**: One line `[Complete]`. Optionally the next line `[StateJSON] <json> `with a minimal payload the frontend can use to build `CharacterSheetState` (see below).
  - Steps to cover (simplified for MVP to match sheet): Origine → Peuple → Race (optional) → Sexe (optional) → **Attribute points** (18 total across 8 attributes) → **Reveal competences** (3–5 from the 72) → **Assign 10 dice** to revealed competences. Then output `[Complete]` and `[StateJSON] {...}`.
- **StateJSON format** (minimal): e.g. `{"attributes":{"FOR":2,"AGI":1,...},"revealed":["GRIMPE","NEGOCIATION",...],"degrees":{"GRIMPE":3,"NEGOCIATION":2,...}}`. Backend prompt must describe this so the model can output valid keys (Attribute enum, Competence enum values).
- **Route**: Reuse `/chat` and `/chat/stream`; inside the handler, if `req.creation_mode` (or `creationMode` from body), set `system = creation_system_prompt(rules_block)` and optionally pass a hint in the user message (e.g. "Current step: origine") so the model stays on track. Alternatively use a separate endpoint `POST /character-creation/chat` to keep play vs creation logic clearly separated.

**Recommendation**: Same `/chat` and `/chat/stream`, with `creationMode: true` in the request body. Backend selects creation system prompt and injects 02_Creation_Personnage content (or RAG with query "character creation steps").

## 2. Frontend: "Create a character" when no character

**Files**: [index.html](index.html), [js/gm-chat.js](js/gm-chat.js)

- **Detection**: On load and when appropriate, check "has character": `sessionStorage.getItem(CHAR_STORAGE_KEY)` and (optional) parse and check it’s not an empty/default state. If no character, show **only** the "Create a character" button; **hide** the checkbox and the input row.
- **Markup**: Inside `.gm-chat-input-wrap`, add a block that is visible when there is no character, e.g. `.gm-chat-no-character` containing a single button: "Create a character" (and i18n for FR). The existing row (checkbox + input + Send) stays in a block that is visible when there is a character or when `creationMode === true`, e.g. `.gm-chat-has-character`.
- **Click "Create a character"**: Set a flag `creationMode = true`; show `.gm-chat-has-character` (input row); optionally send an initial message to the backend (e.g. "I want to create a character") with `creationMode: true` so the first reply is the first step (e.g. Origine choice). Clear or keep chat history for creation (recommend: clear so the log is creation-only).
- **After creation completes**: Set `creationMode = false`; character now exists so the next time the UI refreshes "has character" is true and the normal input stays visible.

## 3. Frontend: parse assistant messages and render buttons/inputs

**File**: [js/gm-chat.js](js/gm-chat.js)

- **Parsing**: When in creation mode (and when rendering an assistant message), scan the message text for:
  - `[Choice id=...]` then all following `[Option ...]` until next `[Choice` or `[Input` or `[Complete]`.
  - `[Input id=...]` with prompt text (rest of line or next line).
  - `[Complete]` and optionally `[StateJSON] ...` (rest of line or next line; parse as JSON).
- **Rendering**: For each assistant message bubble in creation mode:
  - After the main text (or in a dedicated block below it), if parsed blocks exist:
    - For Choice + Options: render a row of `<button>` elements (one per `[Option ...]`). On click: send the option label as the next user message (e.g. "Yômmes") and optionally append structured payload for backend (e.g. `{ creationMode: true, choiceId: "origine", value: "Yômmes" }`).
    - For Input: render a `<input type="text">` (or textarea) and a Submit button. On submit: send the input value as the next user message and optional payload (e.g. `{ creationMode: true, inputId: "name", value: "..." }`).
- **Sending**: When the user clicks an option or submits an input, append the message to `messages`, call the same `/chat/stream` (or `/chat`) with `creationMode: true` and the new message, then re-render and parse the next reply.
- **Completion**: When parsing finds `[Complete]`:
  - If `[StateJSON]` is present: parse JSON and call a small **state-builder** that produces a full `CharacterSheetState` (attributes, competences with degreeCount and isRevealed, souffrances, freeMarks) and then `saveCachedCharacter(state)` (sessionStorage key `drd_simulation_character`). If StateJSON is absent, build state from the list of collected choices (e.g. last user messages keyed by choice/input id) using a fixed mapping (e.g. step "attributes" → parse "FOR=2 AGI=1 ..." or similar).
  - Dispatch `window.dispatchEvent(new CustomEvent('drd-character-created'))`.
  - Clear creation mode; optionally clear creation messages or leave them; show normal input.

## 4. Building CharacterSheetState from StateJSON or answers

**File**: [js/gm-chat.js](js/gm-chat.js) (or a small shared helper if we want the sheet to stay the single source of truth for state shape)

- **State shape**: Must match [CharacterSheetState](src/game/character/CharacterSheetManager.ts): `attributes`, `aptitudeLevels`, `competences`, `souffrances`, `freeMarks`. The sheet’s manager derives `aptitudeLevels` from `attributes`; so we can either build a full state (with computed aptitudeLevels) or only attributes + competences + souffrances + freeMarks and let the sheet’s manager recalc aptitudeLevels on load. The existing `loadState()` expects full state; so the builder must produce full state (e.g. compute aptitudeLevels from attributes per the same rules as CharacterSheetManager, or send aptitudeLevels in StateJSON).
- **Minimal StateJSON from backend**: e.g. `attributes` (Record<Attribute, number>), `revealed` (array of Competence keys), `degrees` (Record<Competence, number>). Frontend builder: start from a **default state** (all attributes 0, all competences unrevealed, degreeCount 0, etc. — same as `createInitialState()` in CharacterSheetManager), then apply attributes, then set revealed and degreeCount for listed competences. Aptitude levels: either compute in JS from attributes (replicate the manager’s formula) or include them in StateJSON. Simplest: backend sends full `attributes` and full `competences` (only degreeCount and isRevealed need to differ from default); or backend sends only the deltas and frontend applies them to a default state.
- **Default state**: Either import from the built character-sheet bundle (if it exposes a `createDefaultCharacterState()` or similar) or duplicate the default structure in gm-chat.js (attributes 0, all competences with degreeCount 0 and isRevealed false, etc.). Duplication is acceptable for MVP if the bundle doesn’t expose it.

## 5. Character sheet: listen for new character

**File**: [src/components/CharacterSheet.tsx](src/components/CharacterSheet.tsx)

- **Event**: In a `useEffect`, subscribe to `window.addEventListener('drd-character-created', handler)`.
- **Handler**: Call `loadCachedCharacter()`; if non-null, `manager.loadState(cached)` and `updateState()` so the sheet re-renders with the new character. Optionally scroll the Play tab to the character sheet section.
- **Cleanup**: Remove the listener on unmount.

## 6. RAG / rules for creation

- **Option A**: When `creationMode` is true, retrieve chunks from 02_Creation_Personnage.md (e.g. by passing a query like "character creation steps origine peuple race attributes competences") and include them in the creation system prompt so the guide follows the rulebook.
- **Option B**: Include 02_Creation_Personnage.md (or a short summary) in a static block in `GM_CREATION_PROMPT`. Prefer A for consistency with the rest of the app.

## 7. i18n and UX

- **Copy**: "Create a character" (EN) / "Créer un personnage" (FR) for the button; reuse or add data-en/data-fr on the new elements. Placeholder for creation input row when in creation mode can be "Your choice or answer…" / "Votre choix ou réponse…".
- **Accessibility**: Buttons and inputs in the chat must have clear labels and work with keyboard (Enter to submit input, focus management after sending).

## Summary of deliverables

| Item | Where | What |

|------|--------|------|

| Request field | backend/main.py | Add `creation_mode: bool = False` to ChatRequest; in handler, branch on it to use creation system prompt. |

| Creation prompt | backend/main.py | Add GM_CREATION_PROMPT (or build from RAG with 02) and define [Choice]/[Option]/[Input]/[Complete]/[StateJSON] format. |

| No-character UI | index.html + gm-chat.js | When no character: show only "Create a character" button; hide checkbox + input row. Toggle visibility via .gm-chat-no-character / .gm-chat-has-character. |

| Creation flow start | gm-chat.js | On "Create a character" click: set creationMode, show input row, send first message with creationMode: true. |

| Parse and render | gm-chat.js | Parse assistant content for [Choice], [Option], [Input], [Complete], [StateJSON]. Render buttons/inputs below message; on click/submit send message and next request. |

| State builder | gm-chat.js | On [Complete]: if [StateJSON] present build CharacterSheetState and saveCachedCharacter(state); else build from collected answers. Dispatch 'drd-character-created'. |

| Sheet listener | CharacterSheet.tsx | On 'drd-character-created': loadCachedCharacter(), manager.loadState(), updateState(). |

## Risks and simplifications

- **LLM output format**: The model might not always emit exactly `[Choice id=...]` / `[Option ...]`. Mitigate: few-shot examples in the creation prompt; fallback to free text (user types the choice) and optional "current step" in the request so the frontend can still advance.
- **StateJSON validity**: The model might output invalid keys or numbers. Mitigate: validate and sanitize in the frontend (ignore unknown keys, clamp numbers); if invalid, build state from conversation only (e.g. last N user messages as attribute/competence choices) with a fixed schema.
- **Simplified creation**: MVP can mirror SimulationEventLog: 18 attribute points, 3–5 revealed competences, 10 dice. Narrative fields (Origine, Peuple, Race, name) can be stored in a separate key (e.g. `drd_character_info`) for display later or omitted; the sheet only needs attributes + competences + souffrances + freeMarks.