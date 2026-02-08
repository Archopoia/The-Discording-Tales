---
name: AI GM True Game Master Improvements
overview: "Review of your current RAG + chat GM implementation and a concrete plan to improve it so the AI behaves like a true Éveilleur: controlled information, explicit roll calls, game tone, and better use of rules, character sheet, and session state."
todos: []
isProject: false
---

# AI GM Improvements: True Game Master Behavior

## Current implementation (summary)

- **Backend**: [backend/main.py](backend/main.py) — FastAPI, single `POST /chat`. RAG over last user message only (top-k=6), system prompt = `GM_INSTRUCTIONS` + rules/lore chunks + optional character blurb. No game state, no session memory beyond the conversation.
- **RAG**: [backend/rag.py](backend/rag.py) — Loads MDs from `systeme_drd`, chunks by `##` sections, FAISS + OpenAI embeddings. No reranker, no metadata filtering.
- **Character**: Snapshot from sessionStorage key `drd_simulation_character` when "Use current character" is checked. Only written when the user completes the **simulation creation flow** in [SimulationEventLog.tsx](src/components/SimulationEventLog.tsx) (dice distribution step). Backend blurb in [main.py](backend/main.py) (`_format_character_blurb`) uses attributes, aptitudeLevels, revealed competences (first 12), souffrances.
- **Frontend**: [js/gm-chat.js](js/gm-chat.js) — Messages in sessionStorage, no parsing of GM output, no structured roll UI; user types roll results in free text.

---

## Gaps vs “true GM” behavior

| Area | Current | True GM expectation |
|------|---------|---------------------|
| **Information** | No explicit “only what’s needed”; LLM can over-explain or under-reveal | Reveal situation and consequences as needed; avoid lore dumps; reveal on success/failure when rules say so |
| **Rolls** | GM says “Roll [X] vs Niv ±Y” in prose; user types result; no structure | One clear roll request per action; parseable format; optional in-chat roll from Character Sheet |
| **Tone** | Short instruction “tone consistent with Iäoduneï” | Weird ethno fantasy, discovery, consequences; in-world voice; no anachronisms |
| **State** | Stateless per request; RAG query = last message only | Track pending roll, scene/situation summary; better retrieval from recent context |
| **Character** | Snapshot only when simulation creation completes; backend doesn’t compute Niv | Always up-to-date when “use character” checked; GM (or backend) can suggest correct Compétence and Niv from sheet |
| **Rules** | “Use only provided rules” in prompt; no enforcement | Never invent mechanics; when in doubt, ask or call for roll; optional validation of Niv range |

---

## Plan

### 1. GM behavior and prompt (backend)

- **Tighten system prompt** in [backend/main.py](backend/main.py):
- **Information economy**: “Give only the information the character would have or that the player needs for their next decision. Do not dump lore or rules unless the player asks or the situation demands it. Reveal consequences after rolls when the rules specify.”
- **Roll discipline**: “When an action requires a roll, ask for exactly one roll: state clearly ‘Roll [Compétence] vs Niv ±X.’ Use only Compétences from the provided rules (e.g. [Négociation], [Investigation]). Do not resolve the outcome yourself—wait for the player to report the result.”
- **Tone**: Add 2–3 short examples of in-world description (weird ethno fantasy, discovery, Iäoduneï/Rils/Peuples). Explicitly: “Describe in the game’s voice; avoid modern slang or meta-commentary.”
- **Structured roll format** (for future parsing): Instruct the model to use a single, parseable line when asking for a roll, e.g. `Roll [Négociation] vs Niv +2` (exact competence name from rules, Niv in range -5 to +10+). Optionally add a “roll_request” block (e.g. JSON or a fixed pattern) so the frontend can detect and offer a “Roll” button.

### 2. Roll flow (frontend + optional backend)

- **Parse GM reply for roll requests**: In [js/gm-chat.js](js/gm-chat.js), detect lines like `Roll […] vs Niv …` (regex). Store last pending roll (compétence name, Niv) in a variable or data attribute.
- **Optional “Roll” action in Play tab**: When a pending roll is detected, show a “Roll in character sheet” (or “Roll here”) control that (a) opens or focuses the character sheet / simulation, or (b) calls existing roll logic (e.g. `rollCompetenceCheck`) if available from the global bundle, then appends a short standardized message to chat (“Rolled [X]: +N vs Niv ±M, success/failure”) and clears pending roll. If in-page roll is not feasible, keep “Roll in character sheet” + prefill placeholder text for the user.
- **Optional backend**: Endpoint or field that returns “suggested roll” (Compétence, Niv) for the last user action, using RAG + character snapshot, so the GM message and the UI stay aligned. Can be phase 2.

### 3. RAG and context (backend)

- **RAG query from conversation**: Instead of retrieving only on the last user message, build a short query from the last 1–2 exchanges (e.g. last user + last assistant, or a 1–2 sentence summary). This reduces irrelevant retrieval when the user says “I do that” or “I try again.”
- **Optional metadata on chunks**: In [backend/rag.py](backend/rag.py), tag chunks with `type: rule | lore | combat | world` (e.g. from filename or section). In retrieval, optionally boost or filter by type when the user message suggests combat, lore, or travel.
- **Reranker (optional)**: Add a lightweight reranker (e.g. Cohere/FlashRank or cross-encoder) on top-k=15 → top-5 to improve relevance for complex queries.

### 4. Session state and memory (backend)

- **Lightweight game state**: Add an optional `gameState` in the request (or store server-side keyed by session id if you add one): `{ "pendingRoll": { "competence": "...", "niv": 0 } | null, "sceneSummary": "1-2 sentences" }`. Backend includes this in the system prompt (“Last requested roll: …; Current situation: …”). Frontend updates `pendingRoll` when it parses a roll request and clears it when the user sends a roll result (or a new action).
- **Scene summary**: Every N turns (e.g. 4), or when the user starts a new “scene,” ask the LLM for a 1–2 sentence summary and store it; feed it in the next system prompt so long chats don’t drift.

### 5. Character sheet integration (frontend + backend)

- **Save snapshot whenever the character changes**: In addition to the simulation creation step, call `saveCachedCharacter(manager.getState())` when the user saves/closes the character sheet, or when they perform a roll in the sheet. Ensure the Play tab and Character Sheet share the same manager/state (or the sheet writes to `drd_simulation_character` on meaningful edits). This way “Use current character” always has fresh data.
- **Backend: use character to suggest Niv**: In the system prompt, include a short note: “If character snapshot is provided, use revealed competences and aptitude levels to choose a plausible Niv d’Épreuve (-5 to +10+) for the situation; prefer competences the character has revealed.” Optionally compute in backend: for a given Compétence, Niv = f(aptitude, competence degree, situation) and pass “suggested Niv” to the prompt so the GM doesn’t invent numbers.

### 6. Safeguards and consistency (backend)

- **Chain-of-thought (optional)**: For development/debug, you can ask the model to think step-by-step (e.g. “Check rules → Decide if roll needed → Describe”) and then strip that from the final reply; or use a separate “reasoning” call and only show the final GM reply. Helps rule adherence.
- **No invented mechanics**: Strengthen prompt: “If no rule or lore chunk covers this, say you don’t have that information and offer a roll or ask the player to clarify. Never invent Niv values outside -5 to +10+.”
- **Validate Niv in roll parsing**: If you add structured roll output or a “suggested roll” endpoint, validate Niv in range and competence against the 72 Compétences list from the rules.

---

## Suggested order of work

1. **Prompt and GM behavior** (1–2): Rework system prompt (information economy, roll discipline, tone, optional structured roll format). No API change.
2. **Character snapshot** (5): Persist character to sessionStorage on sheet save/roll so Play tab always has current data when “Use current character” is checked.
3. **Parse roll + pending state** (2 + 4): Frontend detects “Roll [X] vs Niv Y,” keeps `pendingRoll`; optional “Roll in character sheet” or prefill; optional `gameState.sceneSummary` later.
4. **RAG from context** (3): Build query from last exchange (or short summary) instead of only last user message.
5. **Optional**: Reranker, metadata filtering, backend-suggested Niv, scene summary generation.

---

## Out of scope (for later)

- Fine-tuning a model on your rules/lore.
- Full in-Play-tab dice resolution (reuse existing Character Sheet roll UI is enough for “true GM” feel).
- Multiplayer sessions or persistent server-side sessions (unless you add session ids).
- Streaming replies (UX improvement only).

---

## Files to touch (summary)

| File | Changes |
|------|--------|
| [backend/main.py](backend/main.py) | Expand `GM_INSTRUCTIONS`; optional `gameState` in request and in system prompt; optional “suggested Niv” or roll-format instruction. |
| [backend/rag.py](backend/rag.py) | Optional: query from last exchange or summary; chunk metadata; reranker. |
| [js/gm-chat.js](js/gm-chat.js) | Parse “Roll [X] vs Niv Y”; store pending roll; optional “Roll” button / prefill; send `gameState` if used. |
| [src/components/CharacterSheet.tsx](src/components/CharacterSheet.tsx) or simulation/manager usage | Call `saveCachedCharacter(manager.getState())` on save/roll/close so Play tab gets latest character. |
| [src/components/SimulationEventLog.tsx](src/components/SimulationEventLog.tsx) | Keep existing save; ensure any “roll result” path also saves if needed. |

This keeps your stack (RAG + single LLM, no fine-tuning) and focuses on prompt design, structured roll flow, character sync, and light state so the AI behaves like a true game master: only necessary information, clear roll calls, and tone aligned with Des Récits Discordants.