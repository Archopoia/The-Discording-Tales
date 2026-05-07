// @ts-nocheck
import { state } from './context';

function isLooseNewsletterEmail(value: string): boolean {
    const v = String(value || '').trim();
    if (!v) return false;
    return /\S+@\S+\.\S+/.test(v);
}

function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ========================================
// Newsletter Form
// ========================================
export function initNewsletter() {
    /* Resolve at init time: elements.newsletterForm is captured when the script first runs and can be null with some load orders. */
    var form = document.getElementById('newsletter-form');
    if (!form) return;

    var newsletterEmailInput = document.getElementById('newsletter-email');
    var newsletterSubmitBtn = form.querySelector('button.outpost-cta');

    function updateNewsletterSubmitEnabled() {
        if (!newsletterEmailInput || !newsletterSubmitBtn) return;
        newsletterSubmitBtn.disabled = !isLooseNewsletterEmail(newsletterEmailInput.value);
    }

    if (newsletterEmailInput && newsletterSubmitBtn) {
        ['input', 'change', 'blur'].forEach(function(evt) {
            newsletterEmailInput.addEventListener(evt, updateNewsletterSubmitEnabled);
        });
        newsletterEmailInput.addEventListener('paste', function() {
            setTimeout(updateNewsletterSubmitEnabled, 0);
        });
        updateNewsletterSubmitEnabled();
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const emailInput = document.getElementById('newsletter-email');
        const email = emailInput ? emailInput.value : '';
        const honeypotInput = form.querySelector('input[name="website"]');
        const honeypot = honeypotInput ? honeypotInput.value : '';
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.textContent : '';

        if (!email || !isValidEmail(email)) {
            alert(state.currentLang === 'en' 
                ? 'Please enter a valid email address.' 
                : 'Veuillez entrer une adresse e-mail valide.');
            return;
        }

        function getApiBaseUrl() {
            if (typeof window.GM_API_URL !== 'undefined' && window.GM_API_URL) {
                return String(window.GM_API_URL).trim();
            }
            var meta = document.querySelector('meta[name="gm-api-url"]');
            if (meta && meta.getAttribute('content')) {
                return meta.getAttribute('content').trim();
            }
            return 'http://localhost:8000';
        }

        let slowHintTimer = 0;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = state.currentLang === 'en' ? 'Subscribing…' : 'Abonnement…';
            /* Render free tier + optional Apps Script cold start can take 30s–2m; reassure after a few seconds. */
            slowHintTimer = window.setTimeout(function () {
                if (submitBtn && submitBtn.disabled) {
                    submitBtn.textContent =
                        state.currentLang === 'en'
                            ? 'Still connecting… server may be waking up'
                            : 'Connexion… le serveur démarre peut-être';
                }
            }, 8000);
        }

        try {
            const res = await fetch(getApiBaseUrl() + '/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: String(email).trim(),
                    lang: state.currentLang,
                    source: 'homepage_outpost',
                    honeypot: honeypot || ''
                })
            });

            if (!res.ok) {
                let detail = '';
                try {
                    const data = await res.json();
                    detail = data && data.detail ? String(data.detail) : '';
                } catch (err) {
                    /* ignore parse errors */
                }
                throw new Error(detail || ('HTTP ' + res.status));
            }

            alert(state.currentLang === 'en'
                ? 'Thank you for subscribing! You will be notified when The Discording Tales launches.'
                : 'Merci de vous être abonné ! Vous serez notifié au lancement de The Discording Tales.');
            if (emailInput) emailInput.value = '';
            if (honeypotInput) honeypotInput.value = '';
        } catch (err) {
            alert(state.currentLang === 'en'
                ? 'Subscription is temporarily unavailable. Please try again later.'
                : 'L’abonnement est temporairement indisponible. Veuillez réessayer plus tard.');
            console.error('[Newsletter] subscribe error:', err);
        } finally {
            if (slowHintTimer) window.clearTimeout(slowHintTimer);
            if (submitBtn) {
                submitBtn.textContent = originalBtnText;
            }
            updateNewsletterSubmitEnabled();
        }
    });
}
