/**
 * GM Chat (Play tab): fetch /chat, optional characterSnapshot, gameState; parse roll requests; persist messages in sessionStorage.
 */
(function () {
    'use strict';

    const GM_API_URL = (function () {
        if (typeof window.GM_API_URL !== 'undefined' && window.GM_API_URL) return window.GM_API_URL;
        var meta = document.querySelector('meta[name="gm-api-url"]');
        if (meta && meta.getAttribute('content')) return meta.getAttribute('content').trim();
        return 'http://localhost:8000';
    })();
    const CHAT_STORAGE_KEY = 'drd_gm_chat_messages';
    const CHAR_STORAGE_KEY = 'drd_simulation_character';
    const CHARACTER_INFO_KEY = 'drd_character_info';
    const MARKS_TO_EPROUVER = 10;

    /** Peuples by origin (for hardcoded creation script). */
    var PEUPLES_BY_ORIGIN = {
        'Yômmes': ['Aristois', 'Griscribes', 'Navillis', 'Méridiens'],
        'Yôrres': ['Hauts Ylfes', 'Ylfes pâles', 'Ylfes des lacs', 'Iqqars'],
        'Bêstres': ['Slaadéens', 'Tchalkchaïs']
    };

    /** Get hardcoded creation step content. stepIndex 0=origin, 1=peuple (pass origin), 2=name, 3=hand-off. */
    function getCreationScriptStep(stepIndex, lang, origin) {
        var isFr = lang === 'fr';
        if (stepIndex === 0) {
            var prompt0 = isFr ? "Choisissez l'Origine de votre personnage :" : "Choose your character's Origin:";
            return prompt0 + "\n[Choice id=origin] " + prompt0 + "\n[Option Yômmes]\n[Option Yôrres]\n[Option Bêstres]";
        }
        if (stepIndex === 1 && origin) {
            var options = PEUPLES_BY_ORIGIN[origin] || [];
            var prompt1 = isFr ? "Choisissez le Peuple parmi les " + origin + " :" : "Choose your People among " + origin + ":";
            var optionLines = options.map(function (o) { return "[Option " + o + "]"; }).join("\n");
            return prompt1 + "\n[Choice id=peuple] " + prompt1 + "\n" + optionLines;
        }
        if (stepIndex === 2) {
            var prompt2 = isFr ? "Quel est le nom de votre personnage ? (Optionnel, vous pouvez répondre « aucun » pour passer.)" : "What is your character's name? (Optional; you can reply \"none\" to skip.)";
            return "[Input id=name] " + prompt2;
        }
        if (stepIndex === 3) {
            return isFr
                ? "Le reste de votre personnage (18 points d'attributs, 3 à 5 compétences à révéler, 10 dés à répartir) se fait sur la feuille de personnage ci-dessous. Complétez les étapes là, puis vous pourrez discuter avec l'Éveilleur."
                : "The rest of your character (18 attribute points, 3 to 5 competences to reveal, 10 dice to assign) is to be done on the character sheet below. Complete the steps there; then you can chat with the Éveilleur.";
        }
        return '';
    }

    /** Save narrative (origin, peuple, name) to sessionStorage. */
    function saveCharacterInfoToStorage(info) {
        try {
            sessionStorage.setItem(CHARACTER_INFO_KEY, JSON.stringify(info));
        } catch (e) {}
    }

    var ALL_ATTRIBUTE_KEYS = ['FOR', 'AGI', 'DEX', 'VIG', 'EMP', 'PER', 'CRE', 'VOL'];
    var ALL_APTITUDE_KEYS = ['PUISSANCE', 'AISANCE', 'PRECISION', 'ATHLETISME', 'CHARISME', 'DETECTION', 'REFLEXION', 'DOMINATION'];
    var APTITUDE_ATTR = { PUISSANCE: ['FOR', 'AGI', 'DEX'], AISANCE: ['AGI', 'DEX', 'VIG'], PRECISION: ['DEX', 'PER', 'CRE'], ATHLETISME: ['VIG', 'FOR', 'AGI'], CHARISME: ['EMP', 'VOL', 'PER'], DETECTION: ['PER', 'CRE', 'EMP'], REFLEXION: ['CRE', 'EMP', 'VOL'], DOMINATION: ['VOL', 'VIG', 'FOR'] };
    var ALL_COMPETENCE_KEYS = ['ARME','DESARME','IMPROVISE','LUTTE','BOTTES','RUSES','BANDE','PROPULSE','JETE','FLUIDITE','ESQUIVE','EVASION','ESCAMOTAGE','ILLUSIONS','DISSIMULATION','GESTUELLE','MINUTIE','EQUILIBRE','VISEE','CONDUITE','HABILETE','DEBROUILLARDISE','BRICOLAGE','SAVOIR_FAIRE','ARTIFICES','SECURITE','CASSE_TETES','PAS','GRIMPE','ACROBATIE','POID','SAUT','NATATION','VOL','FOUISSAGE','CHEVAUCHEMENT','SEDUCTION','MIMETISME','CHANT','NEGOCIATION','TROMPERIE','PRESENTATION','INSTRUMENTAL','INSPIRATION','NARRATION','VISION','ESTIMATION','TOUCHER','INVESTIGATION','GOUT','RESSENTI','ODORAT','AUDITION','INTEROCEPTION','ARTISANAT','MEDECINE','INGENIERIE','JEUX','SOCIETE','GEOGRAPHIE','NATURE','PASTORALISME','AGRONOMIE','COMMANDEMENT','OBEISSANCE','OBSTINANCE','GLOUTONNERIE','BEUVERIE','ENTRAILLES','INTIMIDATION','APPRIVOISEMENT','DRESSAGE'];
    var ALL_SOUFFRANCE_KEYS = ['BLESSURES', 'FATIGUES', 'ENTRAVES', 'DISETTES', 'ADDICTIONS', 'MALADIES', 'FOLIES', 'RANCOEURS'];

    /** Regex: "Roll [Compétence] vs Niv ±X" (parseable line from GM). */
    const ROLL_REQUEST_RE = /Roll\s*\[\s*([^\]]+)\s*\]\s*vs\s*Niv\s*([+-]?\d+)/i;
    /** GM mentioned a roll but not in parseable format (e.g. "Roll Charisme vs Niv 4 - 2" without brackets). */
    function rollMentionedButNotParseable(reply) {
        if (!reply || typeof reply !== 'string') return false;
        if (ROLL_REQUEST_RE.test(reply)) return false;
        return /Roll\s/i.test(reply) && /Niv\s/i.test(reply);
    }

    /** In-world phrases shown while waiting for the GM (streaming or not). */
    const THINKING_PHRASES_EN = [
        'The Éveilleur weighs the threads…',
        'Consulting the Rils…',
        'The tale stirs…'
    ];
    const THINKING_PHRASES_FR = [
        "L'Éveilleur pèse les fils…",
        'Consultation des Rils…',
        'Le récit s\'agite…'
    ];

    let messages = [];
    /** Last roll requested by GM: { competence: string, niv: number } or null. Cleared when user sends a message. */
    let pendingRoll = null;
    /** True when last GM message mentions a roll but format was not parseable (no Roll button). */
    let rollFormatHint = false;
    /** True when user clicked "Create a character" and we're in the creation flow until [Complete]. */
    let creationMode = false;

    function loadMessages() {
        try {
            const raw = sessionStorage.getItem(CHAT_STORAGE_KEY);
            messages = raw ? JSON.parse(raw) : [];
        } catch {
            messages = [];
        }
        var lastAssistant = messages.filter(function (m) { return m.role === 'assistant'; }).pop();
        if (lastAssistant) {
            parseReplyForRollRequest(lastAssistant.content);
            rollFormatHint = !pendingRoll && rollMentionedButNotParseable(lastAssistant.content);
        } else {
            rollFormatHint = false;
        }
    }

    function saveMessages() {
        try {
            sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
        } catch (_) {}
    }

    function getCharacterSnapshot() {
        try {
            const raw = sessionStorage.getItem(CHAR_STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    /** True if a character exists in sessionStorage (non-empty: has attribute points or revealed competences or dice assigned). */
    function hasCharacter() {
        var snap = getCharacterSnapshot();
        if (!snap || typeof snap !== 'object') return false;
        var attrs = snap.attributes;
        if (!attrs || typeof attrs !== 'object') return false;
        var attrSum = 0;
        for (var k in attrs) { if (Object.prototype.hasOwnProperty.call(attrs, k)) attrSum += Number(attrs[k]) || 0; }
        var comps = snap.competences;
        if (comps && typeof comps === 'object') {
            for (var c in comps) {
                if (Object.prototype.hasOwnProperty.call(comps, c) && comps[c] && comps[c].isRevealed) return true;
                if (Object.prototype.hasOwnProperty.call(comps, c) && comps[c] && (comps[c].degreeCount || 0) > 0) return true;
            }
        }
        return attrSum > 0;
    }

    /** Show "Create a character" when no character and not in creation mode; else show checkbox + input row. */
    function updateInputVisibility() {
        var noEl = document.getElementById('gm-chat-no-character');
        var hasEl = document.getElementById('gm-chat-has-character');
        if (!noEl || !hasEl) return;
        var showInput = hasCharacter() || creationMode;
        noEl.style.display = showInput ? 'none' : 'block';
        hasEl.style.display = showInput ? 'block' : 'none';
        if (showInput) updateCreationInputDisabled();
    }

    /** Disable chat input and Send button while creationMode; enable when creation is done. Toggle visual disabled class on the input area. */
    function updateCreationInputDisabled() {
        var input = document.getElementById('gm-chat-input');
        var sendBtn = document.getElementById('gm-chat-send');
        if (input) input.disabled = creationMode;
        if (sendBtn) sendBtn.disabled = creationMode;
        var hintEl = document.getElementById('gm-creation-unlock-hint');
        if (hintEl) hintEl.style.display = creationMode ? 'block' : 'none';
        var hasEl = document.getElementById('gm-chat-has-character');
        if (hasEl) {
            if (creationMode) hasEl.classList.add('gm-chat-input--creation-disabled');
            else hasEl.classList.remove('gm-chat-input--creation-disabled');
        }
    }

    /** Show hint above input when in creation mode and last assistant message has no choice/input buttons. (Hidden during hardcoded creation—no LLM to ask for buttons.) */
    function updateCreationNoButtonsHint() {
        var hintEl = document.getElementById('gm-creation-no-buttons-hint');
        if (!hintEl) return;
        if (!creationMode) {
            hintEl.style.display = 'none';
            return;
        }
        hintEl.style.display = 'none';
    }

    /** Parse GM reply for "Roll [X] vs Niv Y"; set pendingRoll and return it. */
    function parseReplyForRollRequest(reply) {
        if (!reply || typeof reply !== 'string') { pendingRoll = null; return null; }
        var m = reply.match(ROLL_REQUEST_RE);
        if (m) {
            pendingRoll = { competence: m[1].trim(), niv: parseInt(m[2], 10) };
            return pendingRoll;
        }
        pendingRoll = null;
        return null;
    }

    /** Build gameState for API: pendingRoll (cleared after send) and optional sceneSummary. */
    function getGameState() {
        if (!pendingRoll && !window.drd_gm_sceneSummary) return null;
        return {
            pendingRoll: pendingRoll || null,
            sceneSummary: (typeof window.drd_gm_sceneSummary === 'string' && window.drd_gm_sceneSummary.trim()) ? window.drd_gm_sceneSummary.trim() : null
        };
    }

    function getLang() {
        try {
            return localStorage.getItem('tdt-lang') || (document.documentElement.lang || 'en').slice(0, 2);
        } catch { return 'en'; }
    }

    function markdownToHtml(text) {
        if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
            marked.setOptions({ gfm: true, breaks: true, tables: true });
            var raw = marked.parse(String(text || ''));
            return DOMPurify.sanitize(raw, {
                ALLOWED_TAGS: ['h1','h2','h3','h4','h5','h6','p','strong','em','b','i','u','ul','ol','li','table','thead','tbody','tr','th','td','blockquote','hr','br','code','pre','a','span','div','button'],
                ALLOWED_ATTR: ['href','class','target','rel','type','data-competence','data-niv']
            });
        }
        return null;
    }

    /** Escape HTML for safe insertion into attribute or text. */
    function escapeHtml(s) {
        if (s == null) return '';
        var div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    function contrib(value, divisor) {
        var v = Number(value);
        return v >= 0 ? Math.floor(v / divisor) : Math.ceil(v / divisor);
    }

    /** Build aptitude levels from attributes (same formula as CharacterSheetManager). */
    function computeAptitudeLevels(attributes) {
        var levels = {};
        ALL_APTITUDE_KEYS.forEach(function (apt) {
            var arr = APTITUDE_ATTR[apt];
            if (!arr) { levels[apt] = 0; return; }
            var a1 = Number(attributes[arr[0]]) || 0, a2 = Number(attributes[arr[1]]) || 0, a3 = Number(attributes[arr[2]]) || 0;
            levels[apt] = contrib(a1, 10 / 6) + contrib(a2, 10 / 3) + contrib(a3, 10);
        });
        return levels;
    }

    /** Build full CharacterSheetState from StateJSON string (attributes, revealed, degrees). */
    function buildCharacterSheetState(stateJsonStr) {
        var data;
        try {
            data = JSON.parse(stateJsonStr);
        } catch (e) {
            return null;
        }
        var attrs = data.attributes || {};
        var attributes = {};
        ALL_ATTRIBUTE_KEYS.forEach(function (k) {
            var v = attrs[k];
            attributes[k] = Math.max(-50, Math.min(50, typeof v === 'number' ? v : 0));
        });
        var aptitudeLevels = computeAptitudeLevels(attributes);
        var competences = {};
        ALL_COMPETENCE_KEYS.forEach(function (k) {
            competences[k] = {
                degreeCount: 0,
                isRevealed: false,
                marks: new Array(MARKS_TO_EPROUVER).fill(false),
                partialMarks: 0,
                eternalMarks: 0,
                eternalMarkIndices: [],
                masteries: [],
                masteryPoints: 0
            };
        });
        var revealed = data.revealed || [];
        var degrees = data.degrees || {};
        revealed.forEach(function (k) {
            if (competences[k]) competences[k].isRevealed = true;
        });
        Object.keys(degrees).forEach(function (k) {
            if (competences[k]) competences[k].degreeCount = Math.max(0, Math.floor(Number(degrees[k]) || 0));
        });
        var souffrances = {};
        ALL_SOUFFRANCE_KEYS.forEach(function (k) {
            souffrances[k] = {
                degreeCount: 0,
                resistanceDegreeCount: 0,
                marks: new Array(MARKS_TO_EPROUVER).fill(false),
                eternalMarks: 0,
                eternalMarkIndices: []
            };
        });
        return { attributes: attributes, aptitudeLevels: aptitudeLevels, competences: competences, souffrances: souffrances, freeMarks: 0 };
    }

    /** On creation complete: save state, dispatch event, exit creation mode. */
    function handleCreationComplete(reply) {
        var blocks = parseCreationBlocks(reply);
        if (!blocks.complete) return;
        var stateJsonStr = blocks.stateJson;
        var state = stateJsonStr ? buildCharacterSheetState(stateJsonStr) : null;
        if (state) {
            try {
                sessionStorage.setItem(CHAR_STORAGE_KEY, JSON.stringify(state));
            } catch (e) {}
            try {
                window.dispatchEvent(new CustomEvent('drd-character-created'));
            } catch (e2) {}
        }
        creationMode = false;
        updateInputVisibility();
    }

    /** Return display-only text for creation messages: strip [Choice], [Option], [Input], [Complete], [StateJSON] tags so only the prompt text is shown. */
    function stripCreationTags(content) {
        if (!content || typeof content !== 'string') return content || '';
        var lines = content.split(/\r?\n/);
        var out = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var trimmed = line.trim();
            var choiceMatch = trimmed.match(/^\[Choice\s+id=\S+\]\s*(.*)$/i);
            if (choiceMatch) {
                var prompt = choiceMatch[1].trim();
                if (prompt) out.push(prompt);
                continue;
            }
            if (/^\[Option\s+[^\]]+\]/i.test(trimmed)) continue;
            var inputMatch = trimmed.match(/^\[Input\s+id=\S+\]\s*(.*)$/i);
            if (inputMatch) {
                var inputPrompt = inputMatch[1].trim();
                if (inputPrompt) out.push(inputPrompt);
                continue;
            }
            if (/^\[Complete\]/i.test(trimmed)) continue;
            if (/^\[StateJSON\]/i.test(trimmed)) continue;
            out.push(line);
        }
        return out.join('\n').trim();
    }

    /** Parse creation-mode blocks from assistant content. Returns { choice: { id, prompt, options }, input: { id, prompt }, complete, stateJson } (only one of choice/input set per message). */
    function parseCreationBlocks(content) {
        if (!content || typeof content !== 'string') return {};
        var lines = content.split(/\r?\n/);
        var out = { choice: null, input: null, complete: false, stateJson: null };
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            var choiceMatch = line.match(/^\[Choice\s+id=(\S+)\]\s*(.*)$/i);
            if (choiceMatch) {
                out.choice = { id: choiceMatch[1], prompt: choiceMatch[2].trim(), options: [] };
                i++;
                while (i < lines.length) {
                    var optLine = lines[i].trim();
                    var optMatch = optLine.match(/^\[Option\s+([^\]]+)\]/i);
                    if (optMatch) {
                        out.choice.options.push(optMatch[1].trim());
                        i++;
                    } else if (/^\[Choice\s/i.test(optLine) || /^\[Input\s/i.test(optLine) || /^\[Complete\]/i.test(optLine)) break;
                    else i++;
                }
                continue;
            }
            var inputMatch = line.match(/^\[Input\s+id=(\S+)\]\s*(.*)$/i);
            if (inputMatch) {
                out.input = { id: inputMatch[1], prompt: inputMatch[2].trim() };
                continue;
            }
            if (/^\[Complete\]/i.test(line)) {
                out.complete = true;
                var nextLine = lines[i + 1] && lines[i + 1].trim();
                var stateMatch = nextLine && nextLine.match(/^\[StateJSON\]\s*(.+)$/i);
                if (stateMatch) out.stateJson = stateMatch[1].trim();
            }
        }
        return out;
    }

    /** Post-process assistant message HTML: turn "Roll [X] vs Niv Y" into styled inline + Roll button (scoped to that message). */
    function injectInlineRollButtons(html) {
        if (!html || typeof html !== 'string') return html;
        var re = /Roll\s*\[\s*([^\]]+)\s*\]\s*vs\s*Niv\s*([+-]?\d+)/gi;
        return html.replace(re, function (match, comp, niv) {
            var c = escapeHtml(comp.trim());
            var n = escapeHtml(String(niv));
            return '<span class="gm-roll-request-inline"><span class="gm-roll-text">Roll [' + c + '] vs Niv ' + n + '</span><button type="button" class="gm-roll-inline-btn" data-competence="' + c + '" data-niv="' + n + '">Roll</button></span>';
        });
    }

    /** Format a user message that is a roll result into structured HTML with tables. */
    function formatUserRollMessage(content) {
        if (!content || typeof content !== 'string') return escapeHtml(content);
        var raw = content.trim();
        if (/Pool\s*:?\s*/.test(raw) && raw.indexOf('\n') === -1) {
            raw = raw.replace(/(\.)(Pool\s*:?\s*)/i, '$1\n$2')
                .replace(/(dD)\s*(Jet\s*:)/i, '$1\n$2')
                .replace(/(=\s*Résultat\s*[+-]?\d+)\s*(Marques)/i, '$1\n$2')
                .replace(/(=\s*Result\s*[+-]?\d+)\s*(Marks)/i, '$1\n$2')
                .replace(/(\])\s*(Vous subissez)/i, '$1\n$2')
                .replace(/(\])\s*(You suffer)/i, '$1\n$2')
                .replace(/(Blessures\.)\s*(R\[)/i, '$1\n$2');
        }
        var lines = raw.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
        var outcome = '';
        var poolLine = '';
        var jetLine = '';
        var feedback = [];
        var i = 0;
        if (lines.length > 0 && /^Rolled\s/i.test(lines[0])) {
            outcome = lines[0];
            i = 1;
        }
        while (i < lines.length) {
            var line = lines[i];
            if (/^Pool\s/i.test(line)) {
                poolLine = line;
                i++;
            } else if (/^(Rolled?|Jet)\s*:?\s*\[/.test(line) && /gardés|kept/.test(line)) {
                jetLine = line;
                i++;
            } else {
                feedback.push(line);
                i++;
            }
        }

        var lang = getLang();
        var isFr = lang === 'fr';
        var L = {
            pool: isFr ? 'Pool' : 'Pool',
            rolled: isFr ? 'Jet' : 'Rolled',
            kept: isFr ? '5 gardés' : '5 kept',
            sum: isFr ? 'Somme' : 'Sum',
            result: isFr ? 'Résultat' : 'Result',
            effects: isFr ? 'Effets' : 'Effects'
        };

        var html = '';
        var hasCard = outcome || poolLine || jetLine || feedback.length > 0;
        if (hasCard) html += '<div class="gm-roll-result-card">';
        if (outcome) html += '<div class="gm-roll-outcome">' + escapeHtml(outcome) + '</div>';

        if (poolLine || jetLine) {
            var rolledMatch = jetLine.match(/\[[+\-0,]+\]/g);
            var rolledDice = rolledMatch && rolledMatch[0] ? rolledMatch[0] : '';
            var keptDice = rolledMatch && rolledMatch[1] ? rolledMatch[1] : '';
            var sumMatch = jetLine.match(/somme\s*([+-]?\d+)|sum\s*([+-]?\d+)/i);
            var sumVal = sumMatch ? (sumMatch[1] || sumMatch[2] || '').trim() : '';
            var resultPart = jetLine.replace(/^.*?→\s*somme\s*[+-]?\d+\.?\s*/i, '').replace(/^.*?→\s*sum\s*[+-]?\d+\.?\s*/i, '');
            html += '<table class="gm-roll-dice-table"><tbody>';
            if (poolLine) html += '<tr><th scope="row">' + L.pool + '</th><td>' + escapeHtml(poolLine.replace(/^Pool\s*:?\s*/i, '')) + '</td></tr>';
            if (rolledDice) html += '<tr><th scope="row">' + L.rolled + '</th><td><span class="gm-dice-faces">' + escapeHtml(rolledDice) + '</span></td></tr>';
            if (keptDice) html += '<tr><th scope="row">' + L.kept + '</th><td><span class="gm-dice-faces gm-dice-kept">' + escapeHtml(keptDice) + '</span></td></tr>';
            if (sumVal) html += '<tr><th scope="row">' + L.sum + '</th><td>' + escapeHtml(sumVal) + '</td></tr>';
            if (resultPart) html += '<tr><th scope="row">' + L.result + '</th><td>' + escapeHtml(resultPart) + '</td></tr>';
            html += '</tbody></table>';
        }

        if (feedback.length) {
            html += '<table class="gm-roll-effects-table"><tbody>';
            feedback.forEach(function (f) {
                html += '<tr><td class="gm-roll-effect-cell">' + escapeHtml(f) + '</td></tr>';
            });
            html += '</tbody></table>';
        }

        if (hasCard) html += '</div>';
        return html || escapeHtml(content);
    }

    /** Current thinking phrase index for rotation. */
    var thinkingPhraseIndex = 0;

    function getThinkingPhrase() {
        var lang = getLang();
        var arr = lang === 'fr' ? THINKING_PHRASES_FR : THINKING_PHRASES_EN;
        var s = arr[thinkingPhraseIndex % arr.length];
        thinkingPhraseIndex += 1;
        return s;
    }

    function renderMessages(container, appendStatus, streamingContent) {
        if (!container) return;
        var lang = getLang();
        var youLabel = lang === 'fr' ? 'Toi' : 'You';
        var gmLabel = lang === 'fr' ? 'Éveilleur' : 'GM';
        // When only streaming content changes, update the streaming bubble in place (no full re-render) so words appear smoothly.
        if (typeof streamingContent === 'string') {
            var existingStream = container.querySelector('.gm-msg-streaming');
            if (existingStream) {
                var streamBody = existingStream.querySelector('.gm-chat-body');
                if (streamBody) {
                    var toShow = creationMode ? stripCreationTags(streamingContent) : streamingContent;
                    var html = markdownToHtml(toShow);
                    if (html != null) {
                        html = injectInlineRollButtons(html);
                        streamBody.innerHTML = html;
                    } else {
                        streamBody.textContent = toShow;
                    }
                    var cursor = streamBody.querySelector('.gm-stream-cursor');
                    if (!cursor) {
                        cursor = document.createElement('span');
                        cursor.className = 'gm-stream-cursor';
                        cursor.setAttribute('aria-hidden', 'true');
                        cursor.textContent = '\u200B';
                        streamBody.appendChild(cursor);
                    }
                }
                container.scrollTop = container.scrollHeight;
                return;
            }
        }
        container.innerHTML = '';
        var idx = 0;
        messages.forEach(function (m) {
            var div = document.createElement('div');
            div.className = 'msg ' + m.role;
            div.setAttribute('role', 'article');
            var role = document.createElement('div');
            role.className = 'role';
            role.textContent = m.role === 'user' ? youLabel : gmLabel;
            var body = document.createElement('div');
            body.className = 'gm-chat-body' + (m.role === 'assistant' ? ' gm-chat-body--md' : '');
            if (m.role === 'assistant') {
                var bodyContent = creationMode ? stripCreationTags(m.content) : m.content;
                var html = markdownToHtml(bodyContent);
                if (html != null) {
                    html = injectInlineRollButtons(html);
                    body.innerHTML = html;
                } else {
                    body.textContent = bodyContent;
                }
                if (creationMode) {
                    var blocks = parseCreationBlocks(m.content);
                    if (blocks.choice && blocks.choice.options.length > 0) {
                        var choiceWrap = document.createElement('div');
                        choiceWrap.className = 'gm-creation-block gm-creation-options';
                        blocks.choice.options.forEach(function (label) {
                            var btn = document.createElement('button');
                            btn.type = 'button';
                            btn.className = 'gm-creation-option-btn';
                            btn.setAttribute('data-option', label);
                            btn.textContent = label;
                            choiceWrap.appendChild(btn);
                        });
                        body.appendChild(choiceWrap);
                    } else if (blocks.input) {
                        var inputWrap = document.createElement('div');
                        inputWrap.className = 'gm-creation-block gm-creation-input';
                        var inp = document.createElement('input');
                        inp.type = 'text';
                        inp.className = 'gm-creation-input-field';
                        inp.setAttribute('data-input-id', blocks.input.id);
                        inp.placeholder = blocks.input.prompt || (getLang() === 'fr' ? 'Votre réponse…' : 'Your answer…');
                        inp.setAttribute('aria-label', blocks.input.prompt || '');
                        var subBtn = document.createElement('button');
                        subBtn.type = 'button';
                        subBtn.className = 'gm-creation-input-submit';
                        subBtn.textContent = getLang() === 'fr' ? 'Envoyer' : 'Send';
                        inputWrap.appendChild(inp);
                        inputWrap.appendChild(subBtn);
                        body.appendChild(inputWrap);
                    }
                }
            } else {
                var userContent = m.content;
                if (typeof userContent === 'string' && /^Rolled\s/i.test(userContent)) {
                    body.className = (body.className || '') + ' gm-chat-body--roll';
                    body.innerHTML = formatUserRollMessage(userContent);
                } else {
                    body.textContent = userContent;
                }
            }
            div.appendChild(role);
            div.appendChild(body);
            container.appendChild(div);
            idx += 1;
        });
        if (typeof streamingContent === 'string' && streamingContent.length >= 0) {
            var streamDiv = document.createElement('div');
            streamDiv.className = 'msg assistant gm-msg-streaming';
            streamDiv.setAttribute('role', 'article');
            var streamRole = document.createElement('div');
            streamRole.className = 'role';
            streamRole.textContent = gmLabel;
            var streamBody = document.createElement('div');
            streamBody.className = 'gm-chat-body gm-chat-body--md';
            var streamToShow = creationMode ? stripCreationTags(streamingContent) : streamingContent;
            var html = markdownToHtml(streamToShow);
            if (html != null) {
                html = injectInlineRollButtons(html);
                streamBody.innerHTML = html;
            } else {
                streamBody.textContent = streamToShow;
            }
            var cursor = document.createElement('span');
            cursor.className = 'gm-stream-cursor';
            cursor.setAttribute('aria-hidden', 'true');
            cursor.textContent = '\u200B';
            streamBody.appendChild(cursor);
            streamDiv.appendChild(streamRole);
            streamDiv.appendChild(streamBody);
            container.appendChild(streamDiv);
        }
        if (appendStatus && typeof appendStatus === 'string') {
            var s = document.createElement('div');
            s.className = 'status gm-status-thinking';
            s.textContent = appendStatus;
            container.appendChild(s);
        }
        if (creationMode) updateCreationNoButtonsHint();
        container.scrollTop = container.scrollHeight;
    }

    function updatePendingRollHint(input, hintEl) {
        if (!hintEl || !input) return;
        var lang = getLang();
        var textPart = hintEl.querySelector('.gm-pending-roll-hint-text');
        var rollBtn = hintEl.querySelector('.gm-roll-btn');
        if (pendingRoll) {
            var nivStr = pendingRoll.niv >= 0 ? '+' + pendingRoll.niv : String(pendingRoll.niv);
            var msg = (lang === 'fr' ? 'Jet demandé : [' : 'Roll requested: [') + pendingRoll.competence + '] vs Niv ' + nivStr + (lang === 'fr' ? '. ' : '. ');
            if (textPart) textPart.textContent = msg;
            hintEl.style.display = 'block';
            hintEl.classList.remove('gm-pending-roll-hint--format-only');
            if (rollBtn) rollBtn.style.display = 'inline-block';
            input.placeholder = lang === 'fr' ? 'Résultat du jet ou votre action…' : 'Report roll result or your action…';
        } else if (rollFormatHint) {
            var formatMsg = lang === 'fr'
                ? 'Le MJ a demandé un jet mais pas au format reconnu. Demandez-lui d\'écrire exactement : Roll [Compétence] vs Niv +X (ex. Roll [Négociation] vs Niv +2). Ou tapez votre résultat ci-dessous.'
                : 'The GM asked for a roll but not in the recognized format. Ask them to write exactly: Roll [Compétence] vs Niv +X (e.g. Roll [Négociation] vs Niv +2). Or type your result below.';
            if (textPart) textPart.textContent = formatMsg;
            hintEl.style.display = 'block';
            hintEl.classList.add('gm-pending-roll-hint--format-only');
            if (rollBtn) rollBtn.style.display = 'none';
            input.placeholder = lang === 'fr' ? 'Résultat du jet ou votre action…' : 'Report roll result or your action…';
        } else {
            hintEl.style.display = 'none';
            if (textPart) textPart.textContent = '';
            if (rollBtn) rollBtn.style.display = 'none';
            input.placeholder = lang === 'fr' ? 'Votre action ou résultat de jet…' : 'Your action or roll result…';
        }
    }

    /** Special rolls: 1d6 > Niv (Rage / Évanouissement per rules). competence name normalized lower. */
    function isRageOrEvanouissementRoll(competence) {
        if (!competence || typeof competence !== 'string') return false;
        var c = competence.trim().toLowerCase().replace(/\s+/g, ' ');
        return c === 'rage' || c === 'évanouissement' || c === 'evanouissement';
    }

    /** Special rolls: 5dD (Fate dice), result = sum vs Niv (Ambiance / Repos per rules). */
    function isAmbianceOrReposRoll(competence) {
        if (!competence || typeof competence !== 'string') return false;
        var c = competence.trim().toLowerCase().replace(/\s+/g, ' ');
        return c === 'ambiance' || c === 'repos';
    }

    /** One dD (Fate): 1-2 → -1, 3-4 → 0, 5-6 → +1 */
    function rollFateDie() {
        var r = Math.floor(Math.random() * 6) + 1;
        if (r <= 2) return -1;
        if (r <= 4) return 0;
        return 1;
    }

    function performPlayTabRoll(container, input, hintEl, sendBtn, useCharCheckbox) {
        if (!pendingRoll || !input) return;
        var lang = getLang();
        var comp = pendingRoll.competence;
        var niv = pendingRoll.niv;

        if (isRageOrEvanouissementRoll(comp)) {
            var d6 = Math.floor(Math.random() * 6) + 1;
            var success = d6 > niv;
            var label = comp.trim();
            var prefill = (lang === 'fr')
                ? 'Rolled ' + label + ': 1d6 = ' + d6 + ', ' + (success ? '>' + niv + ' → agir rationnellement.' : '≤' + niv + ' → instinct domine.')
                : 'Rolled ' + label + ': 1d6 = ' + d6 + ', ' + (success ? '>' + niv + ' → act rationally.' : '≤' + niv + ' → instinct dominates.');
            input.value = prefill;
            var liveEl = document.getElementById('gm-roll-result-announce');
            if (liveEl) liveEl.textContent = (lang === 'fr' ? 'Jet de ' : 'Roll ') + label + ': ' + d6 + ' — ' + (success ? (lang === 'fr' ? 'succès' : 'success') : (lang === 'fr' ? 'échec' : 'failure'));
            if (container) container.scrollTop = container.scrollHeight;
            sendMessage(container, input, sendBtn, useCharCheckbox, hintEl);
            updatePendingRollHint(input, hintEl);
            return;
        }

        if (isAmbianceOrReposRoll(comp)) {
            var dice = [];
            var i;
            for (i = 0; i < 5; i++) dice.push(rollFateDie());
            var sum = dice.reduce(function (a, b) { return a + b; }, 0);
            var success5dD = sum >= niv;
            var faceStr = dice.map(function (d) { return d === 1 ? '+' : (d === 0 ? '0' : '-'); }).join(',');
            var label5 = comp.trim();
            var prefill5 = (lang === 'fr')
                ? 'Rolled ' + label5 + ': 5dD = [' + faceStr + '] → somme ' + (sum >= 0 ? '+' : '') + sum + ' vs Niv ' + niv + ', ' + (success5dD ? 'succès.' : 'échec.')
                : 'Rolled ' + label5 + ': 5dD = [' + faceStr + '] → sum ' + (sum >= 0 ? '+' : '') + sum + ' vs Niv ' + niv + ', ' + (success5dD ? 'success.' : 'failure.');
            input.value = prefill5;
            var liveEl5 = document.getElementById('gm-roll-result-announce');
            if (liveEl5) liveEl5.textContent = (lang === 'fr' ? 'Jet de ' : 'Roll ') + label5 + ': ' + sum + ' — ' + (success5dD ? (lang === 'fr' ? 'succès' : 'success') : (lang === 'fr' ? 'échec' : 'failure'));
            if (container) container.scrollTop = container.scrollHeight;
            sendMessage(container, input, sendBtn, useCharCheckbox, hintEl);
            updatePendingRollHint(input, hintEl);
            return;
        }

        var drdPerformRoll = typeof window.drdPerformRoll === 'function' ? window.drdPerformRoll : null;
        if (!drdPerformRoll) {
            var msg = lang === 'fr' ? 'Ouvrez la feuille de personnage ci-dessous, lancez le jet, puis tapez le résultat ici.' : 'Open the character sheet below, roll there, then type the result here.';
            input.placeholder = msg;
            return;
        }
        var textPart = hintEl ? hintEl.querySelector('.gm-pending-roll-hint-text') : null;
        var rollBtn = hintEl ? hintEl.querySelector('.gm-roll-btn') : null;
        var rollingMsg = lang === 'fr' ? 'Jet en cours…' : 'Rolling…';
        if (textPart) textPart.textContent = rollingMsg;
        if (rollBtn) rollBtn.disabled = true;

        function onResult(ev) {
            window.removeEventListener('drd-roll-result', onResult);
            var d = ev.detail;
            if (d.error === 'no_character') {
                if (rollBtn) rollBtn.disabled = false;
                updatePendingRollHint(input, hintEl);
                input.value = lang === 'fr' ? "Aucun personnage chargé. Créez-en un dans la feuille ci-dessous et cochez « Utiliser le personnage actuel »." : "No character loaded. Create one in the sheet below and use 'Use current character'.";
                return;
            }
            if (d.error === 'unknown_competence') {
                if (rollBtn) rollBtn.disabled = false;
                updatePendingRollHint(input, hintEl);
                input.value = lang === 'fr' ? 'Compétence introuvable. Saisissez le résultat du jet manuellement.' : 'Could not find that competence. Type your roll result manually.';
                return;
            }
            var outcome = d.criticalSuccess ? (lang === 'fr' ? 'succès critique' : 'critical success') : d.success ? (lang === 'fr' ? 'succès' : 'success') : d.criticalFailure ? (lang === 'fr' ? 'échec critique' : 'critical failure') : (lang === 'fr' ? 'échec' : 'failure');
            var nivStr = d.nivEpreuve >= 0 ? '+' + d.nivEpreuve : String(d.nivEpreuve);
            var resultStr = d.result >= 0 ? '+' + d.result : String(d.result);
            var prefill = 'Rolled ' + d.competenceLabel + ': ' + resultStr + ' vs Niv ' + nivStr + ', ' + outcome + '.';
            if (d.diceBreakdown && typeof d.diceBreakdown === 'string') {
                prefill += '\n' + d.diceBreakdown;
            }
            if (d.feedbackLines && Array.isArray(d.feedbackLines) && d.feedbackLines.length > 0) {
                prefill += '\n' + d.feedbackLines.join('\n');
            }
            input.value = prefill;
            var liveParts = [(lang === 'fr' ? 'Résultat du jet : ' : 'Roll result: ') + outcome];
            if (d.diceBreakdown) liveParts.push(d.diceBreakdown);
            if (d.feedbackLines && d.feedbackLines.length > 0) {
                liveParts.push(d.feedbackLines.join('. '));
            }
            var liveEl = document.getElementById('gm-roll-result-announce');
            if (liveEl) liveEl.textContent = liveParts.join('. ');
            if (container) container.scrollTop = container.scrollHeight;
            if (rollBtn) rollBtn.disabled = false;
            sendMessage(container, input, sendBtn, useCharCheckbox, hintEl);
            updatePendingRollHint(input, hintEl);
        }

        window.addEventListener('drd-roll-result', onResult);
        drdPerformRoll({ competence: pendingRoll.competence, niv: pendingRoll.niv });
    }

    function setError(container, err) {
        if (!container) return;
        var existing = container.querySelector('.error');
        if (existing) existing.remove();
        var el = document.createElement('div');
        el.className = 'error';
        el.textContent = err;
        container.appendChild(el);
        container.scrollTop = container.scrollHeight;
    }

    function clearError(container) {
        var el = container ? container.querySelector('.error') : null;
        if (el) el.remove();
    }

    function sendMessage(container, input, sendBtn, useCharCheckbox, hintEl, optionalContent) {
        var text = (optionalContent !== undefined && optionalContent !== null) ? String(optionalContent).trim() : ((input && input.value) ? input.value.trim() : '');
        if (!text) return;

        var useChar = useCharCheckbox && useCharCheckbox.checked;
        var snapshot = useChar ? getCharacterSnapshot() : null;

        messages.push({ role: 'user', content: text });
        if (input) input.value = '';
        saveMessages();
        thinkingPhraseIndex = 0;
        var thinkingPhrase = getThinkingPhrase();
        renderMessages(container, thinkingPhrase);
        clearError(container);
        if (sendBtn) sendBtn.disabled = true;

        var body = {
            messages: messages.map(function (m) { return { role: m.role, content: m.content }; })
        };
        if (snapshot) body.characterSnapshot = snapshot;
        var gameState = getGameState();
        if (gameState) body.gameState = gameState;
        if (creationMode) body.creationMode = true;
        pendingRoll = null;
        rollFormatHint = false;

        var thinkingInterval = setInterval(function () {
            renderMessages(container, getThinkingPhrase());
        }, 2200);

        function stopThinking() {
            clearInterval(thinkingInterval);
        }

        function finishReply(reply) {
            stopThinking();
            messages.push({ role: 'assistant', content: reply });
            saveMessages();
            parseReplyForRollRequest(reply);
            rollFormatHint = !pendingRoll && rollMentionedButNotParseable(reply);
            if (creationMode && messages.length >= 2) {
                var userMsg = messages[messages.length - 2];
                var prevAssistant = messages.length >= 3 ? messages[messages.length - 3].content : '';
                if (userMsg.role === 'user' && prevAssistant) {
                    var prevBlocks = parseCreationBlocks(prevAssistant);
                    var field = (prevBlocks.choice && prevBlocks.choice.id) ? prevBlocks.choice.id : (prevBlocks.input && prevBlocks.input.id) ? prevBlocks.input.id : null;
                    if (field && (field === 'origine' || field === 'peuple' || field === 'name')) {
                        try {
                            window.dispatchEvent(new CustomEvent('drd-narrative-from-chat', { detail: { field: field === 'origine' ? 'origin' : field, value: String(userMsg.content || '').trim() } }));
                        } catch (e) {}
                    }
                }
            }
            renderMessages(container);
            if (typeof updatePendingRollHint === 'function' && input && hintEl) updatePendingRollHint(input, hintEl);
            if (creationMode && parseCreationBlocks(reply).complete) {
                handleCreationComplete(reply);
            }
        }

        function failReply(err) {
            stopThinking();
            setError(container, 'Error: ' + (err.message || String(err)));
            messages.pop();
            saveMessages();
            renderMessages(container);
        }

        fetch(GM_API_URL + '/chat/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
            .then(function (r) {
                if (!r.ok) {
                    return r.text().then(function (t) {
                        try {
                            var j = JSON.parse(t);
                            throw new Error(j.detail || r.statusText);
                        } catch (e) {
                            if (e instanceof Error && e.message !== undefined) throw e;
                            throw new Error(r.statusText);
                        }
                    });
                }
                if (!r.body) {
                    throw new Error('No response body');
                }
                return r.body.getReader();
            })
            .then(function (reader) {
                var decoder = new TextDecoder();
                var buffer = '';
                var fullText = '';

                function processChunk(chunk) {
                    buffer += decoder.decode(chunk, { stream: true });
                    var parts = buffer.split('\n\n');
                    buffer = parts.pop() || '';
                    for (var i = 0; i < parts.length; i++) {
                        var line = parts[i].trim();
                        if (line.indexOf('data: ') === 0) {
                            var jsonStr = line.slice(5).trim();
                            if (jsonStr === '[DONE]' || jsonStr === '') continue;
                            try {
                                var data = JSON.parse(jsonStr);
                                if (data.error) {
                                    throw new Error(data.error);
                                }
                                if (data.done) return true;
                                if (data.delta) {
                                    fullText += data.delta;
                                    stopThinking();
                                    renderMessages(container, null, fullText);
                                }
                            } catch (e) {
                                if (e instanceof SyntaxError) continue;
                                throw e;
                            }
                        }
                    }
                    return false;
                }

                function readNext() {
                    return reader.read().then(function (result) {
                        if (result.done) {
                            finishReply(fullText.trim());
                            return;
                        }
                        var done = processChunk(result.value);
                        if (done) {
                            finishReply(fullText.trim());
                            return;
                        }
                        return readNext();
                    });
                }

                return readNext();
            })
            .catch(function (e) {
                fetch(GM_API_URL + '/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                })
                    .then(function (r) {
                        if (!r.ok) {
                            return r.json().catch(function () { return {}; }).then(function (j) {
                                var d = j.detail;
                                throw new Error(typeof d === 'string' ? d : (Array.isArray(d) ? d.map(function (x) { return x.msg || JSON.stringify(x); }).join('; ') : r.statusText));
                            });
                        }
                        return r.json();
                    })
                    .then(function (data) {
                        var reply = (data && data.reply) ? data.reply : '';
                        finishReply(reply);
                    })
                    .catch(function (fallbackErr) {
                        failReply(fallbackErr);
                    });
            })
            .finally(function () {
                stopThinking();
                if (sendBtn) sendBtn.disabled = false;
            });
    }

    function init() {
        var container = document.getElementById('gm-chat-messages');
        var input = document.getElementById('gm-chat-input');
        var sendBtn = document.getElementById('gm-chat-send');
        var useChar = document.getElementById('gm-use-character');
        var inputWrap = input ? input.closest('.gm-chat-input-wrap') : null;
        var hintEl = null;
        if (inputWrap) {
            hintEl = document.createElement('div');
            hintEl.className = 'gm-pending-roll-hint';
            hintEl.setAttribute('aria-live', 'polite');
            hintEl.style.display = 'none';
            var textPart = document.createElement('span');
            textPart.className = 'gm-pending-roll-hint-text';
            var rollBtn = document.createElement('button');
            rollBtn.type = 'button';
            rollBtn.className = 'gm-roll-btn';
            rollBtn.setAttribute('aria-label', getLang() === 'fr' ? 'Lancer le jet demandé' : 'Roll the requested check');
            rollBtn.textContent = getLang() === 'fr' ? 'Lancer le jet' : 'Roll';
            rollBtn.style.display = 'none';
            rollBtn.addEventListener('click', function () {
                performPlayTabRoll(container, input, hintEl, sendBtn, useChar);
            });
            hintEl.appendChild(textPart);
            hintEl.appendChild(rollBtn);
            var hasCharEl = inputWrap.querySelector('.gm-chat-has-character');
            var row = inputWrap.querySelector('.gm-chat-input-row');
            if (hasCharEl && row) hasCharEl.insertBefore(hintEl, row);
            else if (row) inputWrap.insertBefore(hintEl, row);
            var noButtonsHint = document.createElement('div');
            noButtonsHint.id = 'gm-creation-no-buttons-hint';
            noButtonsHint.className = 'gm-creation-no-buttons-hint';
            noButtonsHint.setAttribute('aria-live', 'polite');
            noButtonsHint.style.display = 'none';
            if (hasCharEl) hasCharEl.insertBefore(noButtonsHint, hasCharEl.firstChild);
            var unlockHint = document.createElement('div');
            unlockHint.id = 'gm-creation-unlock-hint';
            unlockHint.className = 'gm-creation-unlock-hint';
            unlockHint.setAttribute('aria-live', 'polite');
            unlockHint.style.display = 'none';
            unlockHint.textContent = getLang() === 'fr' ? 'Complétez la création du personnage ci-dessous pour débloquer le chat.' : 'Complete character creation below to unlock the chat.';
            if (hasCharEl) hasCharEl.insertBefore(unlockHint, hasCharEl.firstChild);
            var liveRegion = document.createElement('div');
            liveRegion.id = 'gm-roll-result-announce';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.className = 'screen-reader-text';
            liveRegion.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';
            inputWrap.appendChild(liveRegion);
        }

        loadMessages();
        renderMessages(container);
        updatePendingRollHint(input, hintEl);
        updateInputVisibility();
        updateCreationNoButtonsHint();

        function submit() {
            sendMessage(container, input, sendBtn, useChar, hintEl);
        }

        var createBtn = document.getElementById('gm-chat-create-character');
        if (createBtn) {
            createBtn.addEventListener('click', function () {
                creationMode = true;
                updateInputVisibility();
                messages = [];
                var firstStepContent = getCreationScriptStep(0, getLang(), null);
                messages.push({ role: 'assistant', content: firstStepContent });
                saveMessages();
                renderMessages(container);
            });
        }

        window.addEventListener('drd-character-created', function () {
            var isFr = getLang() === 'fr';
            var readyMsg = isFr
                ? "Votre personnage est prêt. Vous pouvez maintenant discuter avec l'Éveilleur et lancer la simulation."
                : "Your character is ready. You can now chat with the Éveilleur and start the simulation.";
            messages.push({ role: 'assistant', content: readyMsg });
            saveMessages();
            renderMessages(container);
            creationMode = false;
            updateInputVisibility();
        });

        function notifyCreationStepFromSheet(step, payload) {
            var s = (typeof step === 'string') ? step : (step && step.detail && step.detail.step) ? step.detail.step : '';
            if (s === 'attributes' || s === 'reveal' || s === 'dice') {
                return;
            }
            var data = payload || (step && step.detail && step.detail.payload) ? (step.detail && step.detail.payload) : null;
            if (typeof step === 'object' && step && step.detail) { data = step.detail.payload || data; }
            var isFr = getLang() === 'fr';
            var msg = '';
            if (s === 'attributes') {
                if (data && data.attributes && typeof data.attributes === 'object') {
                    var parts = [];
                    ALL_ATTRIBUTE_KEYS.forEach(function (k) {
                        var v = data.attributes[k];
                        if (v !== undefined && v !== null) parts.push(k + ' ' + Number(v));
                    });
                    msg = parts.length ? (isFr ? "J'ai réparti mes 18 points : " + parts.join(', ') + '.' : "I've assigned my 18 points: " + parts.join(', ') + '.') : '';
                }
                if (!msg) msg = isFr ? "J'ai réparti mes 18 points d'attributs dans la feuille de personnage." : "I've assigned my 18 attribute points in the character sheet.";
            } else if (s === 'reveal') {
                if (data && Array.isArray(data.revealed) && data.revealed.length > 0) {
                    msg = isFr ? "J'ai révélé les compétences : " + data.revealed.join(', ') + "." : "I've revealed the competences: " + data.revealed.join(', ') + ".";
                } else {
                    msg = isFr ? "J'ai révélé 3 à 5 compétences dans la feuille de personnage." : "I've revealed 3 to 5 competences in the character sheet.";
                }
            } else if (s === 'dice') {
                if (data && data.degrees && typeof data.degrees === 'object') {
                    var degParts = [];
                    for (var ck in data.degrees) { if (Object.prototype.hasOwnProperty.call(data.degrees, ck)) { var dv = data.degrees[ck]; if (dv) degParts.push(ck + ' ' + Number(dv)); } }
                    if (degParts.length) msg = isFr ? "J'ai réparti mes 10 dés : " + degParts.join(', ') + "." : "I've assigned my 10 dice: " + degParts.join(', ') + ".";
                }
                if (!msg) msg = isFr ? "J'ai réparti mes 10 dés dans la feuille de personnage et je suis prêt à lancer la simulation." : "I've assigned my 10 dice in the character sheet and I'm ready to launch the simulation.";
            } else if (s === 'origin' && data && data.value) {
                msg = isFr ? "Mon origine : " + String(data.value) + "." : "I choose " + String(data.value) + " as my origin.";
            } else if (s === 'peuple' && data && data.value) {
                msg = isFr ? "Mon peuple : " + String(data.value) + "." : "I choose " + String(data.value) + " as my people.";
            } else if (s === 'name' && data && data.value) {
                var nameVal = String(data.value).trim();
                msg = nameVal ? (isFr ? "Le nom de mon personnage : " + nameVal + "." : "My character's name: " + nameVal + ".") : (isFr ? "Je ne donne pas de nom pour l'instant." : "I'll skip the name for now.");
            }
            if (msg && container && input) {
                creationMode = true;
                updateInputVisibility();
                sendMessage(container, input, sendBtn, useChar, hintEl, msg);
            }
        }
        window.drdNotifyCreationStepFromSheet = notifyCreationStepFromSheet;
        window.addEventListener('drd-creation-step-from-sheet', function (ev) {
            var step = (ev && ev.detail && ev.detail.step) ? ev.detail.step : '';
            var payload = (ev && ev.detail && ev.detail.payload) ? ev.detail.payload : null;
            if (step) notifyCreationStepFromSheet(step, payload);
        });

        if (sendBtn) sendBtn.addEventListener('click', submit);
        if (input) {
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                }
            });
        }

        if (container) {
            container.addEventListener('click', function (e) {
                var rollBtn = e.target && e.target.closest && e.target.closest('.gm-roll-inline-btn');
                if (rollBtn) {
                    var comp = rollBtn.getAttribute('data-competence');
                    var nivStr = rollBtn.getAttribute('data-niv');
                    var niv = parseInt(nivStr, 10);
                    if (!comp || isNaN(niv)) return;
                    pendingRoll = { competence: comp, niv: niv };
                    performPlayTabRoll(container, input, hintEl, sendBtn, useChar);
                    return;
                }
                var optionBtn = e.target && e.target.closest && e.target.closest('.gm-creation-option-btn');
                if (optionBtn && creationMode) {
                    var option = optionBtn.getAttribute('data-option');
                    if (!option) return;
                    var lastAssistant = messages.filter(function (m) { return m.role === 'assistant'; }).pop();
                    if (!lastAssistant) return;
                    var blocks = parseCreationBlocks(lastAssistant.content);
                    var choiceId = blocks.choice && blocks.choice.id ? blocks.choice.id : null;
                    messages.push({ role: 'user', content: option });
                    if (choiceId === 'origin') {
                        messages.push({ role: 'assistant', content: getCreationScriptStep(1, getLang(), option) });
                    } else if (choiceId === 'peuple') {
                        messages.push({ role: 'assistant', content: getCreationScriptStep(2, getLang(), null) });
                    }
                    saveMessages();
                    renderMessages(container);
                    return;
                }
                var inputSubBtn = e.target && e.target.closest && e.target.closest('.gm-creation-input-submit');
                if (inputSubBtn && creationMode) {
                    var block = inputSubBtn.closest('.gm-creation-block');
                    var field = block ? block.querySelector('.gm-creation-input-field') : null;
                    var val = field ? field.value.trim() : '';
                    var nameVal = (val === '' || /^(none|aucun)$/i.test(val)) ? '' : val;
                    messages.push({ role: 'user', content: nameVal || (getLang() === 'fr' ? 'Aucun' : 'None') });
                    var originFromMsg = messages.length >= 2 && messages[1].role === 'user' ? messages[1].content : '';
                    var peupleFromMsg = messages.length >= 4 && messages[3].role === 'user' ? messages[3].content : '';
                    saveCharacterInfoToStorage({ origin: originFromMsg, peuple: peupleFromMsg, name: nameVal });
                    messages.push({ role: 'assistant', content: getCreationScriptStep(3, getLang(), null) });
                    var defaultState = buildCharacterSheetState('{}');
                    if (defaultState) {
                        try {
                            sessionStorage.setItem(CHAR_STORAGE_KEY, JSON.stringify(defaultState));
                        } catch (e) {}
                        try {
                            window.dispatchEvent(new CustomEvent('drd-creation-started'));
                        } catch (e2) {}
                    }
                    saveMessages();
                    renderMessages(container);
                    return;
                }
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
