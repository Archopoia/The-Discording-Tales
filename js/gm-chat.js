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
                    var html = markdownToHtml(streamingContent);
                    if (html != null) {
                        html = injectInlineRollButtons(html);
                        streamBody.innerHTML = html;
                    } else {
                        streamBody.textContent = streamingContent;
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
                var html = markdownToHtml(m.content);
                if (html != null) {
                    html = injectInlineRollButtons(html);
                    body.innerHTML = html;
                } else {
                    body.textContent = m.content;
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
            var html = markdownToHtml(streamingContent);
            if (html != null) {
                html = injectInlineRollButtons(html);
                streamBody.innerHTML = html;
            } else {
                streamBody.textContent = streamingContent;
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

    function sendMessage(container, input, sendBtn, useCharCheckbox, hintEl) {
        var text = (input && input.value) ? input.value.trim() : '';
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
            renderMessages(container);
            if (typeof updatePendingRollHint === 'function' && input && hintEl) updatePendingRollHint(input, hintEl);
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
            var row = inputWrap.querySelector('.gm-chat-input-row');
            inputWrap.insertBefore(hintEl, row);
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

        function submit() {
            sendMessage(container, input, sendBtn, useChar, hintEl);
        }

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
                var btn = e.target && e.target.closest && e.target.closest('.gm-roll-inline-btn');
                if (!btn) return;
                var comp = btn.getAttribute('data-competence');
                var nivStr = btn.getAttribute('data-niv');
                var niv = parseInt(nivStr, 10);
                if (!comp || isNaN(niv)) return;
                pendingRoll = { competence: comp, niv: niv };
                performPlayTabRoll(container, input, hintEl, sendBtn, useChar);
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
