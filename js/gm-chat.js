/**
 * GM Chat (Play tab): fetch /chat, optional characterSnapshot, gameState; parse roll requests; persist messages in sessionStorage.
 */
(function () {
    'use strict';

    const GM_API_URL = typeof window.GM_API_URL !== 'undefined' ? window.GM_API_URL : 'http://localhost:8000';
    const CHAT_STORAGE_KEY = 'drd_gm_chat_messages';
    const CHAR_STORAGE_KEY = 'drd_simulation_character';

    /** Regex: "Roll [Compétence] vs Niv ±X" (parseable line from GM). */
    const ROLL_REQUEST_RE = /Roll\s*\[\s*([^\]]+)\s*\]\s*vs\s*Niv\s*([+-]?\d+)/i;

    let messages = [];
    /** Last roll requested by GM: { competence: string, niv: number } or null. Cleared when user sends a message. */
    let pendingRoll = null;

    function loadMessages() {
        try {
            const raw = sessionStorage.getItem(CHAT_STORAGE_KEY);
            messages = raw ? JSON.parse(raw) : [];
        } catch {
            messages = [];
        }
        var lastAssistant = messages.filter(function (m) { return m.role === 'assistant'; }).pop();
        if (lastAssistant) parseReplyForRollRequest(lastAssistant.content);
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
            marked.setOptions({ gfm: true, breaks: true });
            var raw = marked.parse(String(text || ''));
            return DOMPurify.sanitize(raw, {
                ALLOWED_TAGS: ['h1','h2','h3','h4','h5','h6','p','strong','em','b','i','u','ul','ol','li','table','thead','tbody','tr','th','td','blockquote','hr','br','code','pre','a','span','div'],
                ALLOWED_ATTR: ['href','class','target','rel']
            });
        }
        return null;
    }

    function renderMessages(container, appendStatus) {
        if (!container) return;
        var lang = getLang();
        var youLabel = lang === 'fr' ? 'Toi' : 'You';
        var gmLabel = lang === 'fr' ? 'Éveilleur' : 'GM';
        container.innerHTML = '';
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
                if (html != null) { body.innerHTML = html; } else { body.textContent = m.content; }
            } else {
                body.textContent = m.content;
            }
            div.appendChild(role);
            div.appendChild(body);
            container.appendChild(div);
        });
        if (appendStatus && typeof appendStatus === 'string') {
            var s = document.createElement('div');
            s.className = 'status';
            s.textContent = appendStatus;
            container.appendChild(s);
        }
        container.scrollTop = container.scrollHeight;
    }

    function updatePendingRollHint(input, hintEl) {
        if (!hintEl || !input) return;
        var lang = getLang();
        if (pendingRoll) {
            var nivStr = pendingRoll.niv >= 0 ? '+' + pendingRoll.niv : String(pendingRoll.niv);
            hintEl.textContent = (lang === 'fr' ? 'Jet demandé : [' : 'Roll requested: [') + pendingRoll.competence + '] vs Niv ' + nivStr + (lang === 'fr' ? '. Lancez dans la feuille de personnage ci-dessous, puis rapportez le résultat ici.' : '. Roll in the character sheet below, then report the result here.');
            hintEl.style.display = 'block';
            input.placeholder = lang === 'fr' ? 'Résultat du jet ou votre action…' : 'Report roll result or your action…';
        } else {
            hintEl.style.display = 'none';
            hintEl.textContent = '';
            input.placeholder = lang === 'fr' ? 'Votre action ou résultat de jet…' : 'Your action or roll result…';
        }
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
        renderMessages(container, '…');
        clearError(container);
        if (sendBtn) sendBtn.disabled = true;

        var body = {
            messages: messages.map(function (m) { return { role: m.role, content: m.content }; })
        };
        if (snapshot) body.characterSnapshot = snapshot;
        var gameState = getGameState();
        if (gameState) body.gameState = gameState;
        pendingRoll = null;

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
                messages.push({ role: 'assistant', content: reply });
                saveMessages();
                parseReplyForRollRequest(reply);
                renderMessages(container);
                if (typeof updatePendingRollHint === 'function' && input && hintEl) updatePendingRollHint(input, hintEl);
            })
            .catch(function (e) {
                setError(container, 'Error: ' + (e.message || String(e)));
                messages.pop();
                saveMessages();
                renderMessages(container);
            })
            .finally(function () {
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
            var row = inputWrap.querySelector('.gm-chat-input-row');
            inputWrap.insertBefore(hintEl, row);
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
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
