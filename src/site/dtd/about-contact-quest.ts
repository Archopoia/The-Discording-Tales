/**
 * About tab: portfolio-style interactive contact quest (mailto), scoped to #about.
 */
import { state } from './context';
import { NEWSLETTER_SOURCE_ABOUT_CONTACT, subscribeOutpost } from './newsletter';

const MAILTO = 'thediscordingtales@gmail.com';

let currentQuestion = 1;
const totalQuestions = 5;

function getWrap(): HTMLElement | null {
    return document.querySelector('.about-contact-quest-wrap');
}

function shake(el: HTMLElement) {
    el.style.animation = 'none';
    void el.offsetHeight;
    el.style.animation = 'about-quest-shake 0.35s ease';
    setTimeout(() => {
        el.style.animation = '';
    }, 350);
}

function updateProgressDots(wrap: HTMLElement) {
    wrap.querySelectorAll('.about-quest-dots .dot').forEach((dot, index) => {
        dot.classList.toggle('active', index < currentQuestion);
    });
}

function setNavButtons(wrap: HTMLElement) {
    const prevBtn = wrap.querySelector<HTMLButtonElement>('#about-quest-prev-btn');
    const nextBtn = wrap.querySelector<HTMLButtonElement>('#about-quest-next-btn');
    const mobileSubmit = wrap.querySelector<HTMLButtonElement>('#about-quest-submit-mobile');
    if (prevBtn) prevBtn.disabled = currentQuestion === 1;
    if (nextBtn) nextBtn.style.display = currentQuestion === totalQuestions ? 'none' : '';
    if (mobileSubmit) mobileSubmit.style.display = currentQuestion === totalQuestions ? '' : 'none';
}

function mobileStepValid(currentQ: HTMLElement): boolean {
    const requiredRadioNames = new Set<string>();
    currentQ.querySelectorAll<HTMLInputElement>('input[type="radio"][required]').forEach((r) => {
        requiredRadioNames.add(r.name);
    });
    for (const name of requiredRadioNames) {
        const group = currentQ.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${CSS.escape(name)}"]`);
        if (!Array.from(group).some((r) => r.checked)) return false;
    }
    const nonRadio = currentQ.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        'input[required]:not([type="radio"]), textarea[required]'
    );
    for (let i = 0; i < nonRadio.length; i++) {
        if (!nonRadio[i].value.trim()) return false;
    }
    return true;
}

export function nextAboutQuestQuestion(): void {
    const wrap = getWrap();
    if (!wrap) return;

    const currentQ = wrap.querySelector<HTMLElement>(`.about-mobile-question[data-question="${currentQuestion}"]`);
    if (!currentQ) return;

    if (!mobileStepValid(currentQ)) {
        shake(currentQ);
        return;
    }

    currentQ.classList.remove('active');
    currentQ.style.display = 'none';

    currentQuestion += 1;
    const nextQ = wrap.querySelector<HTMLElement>(`.about-mobile-question[data-question="${currentQuestion}"]`);
    if (nextQ) {
        nextQ.classList.add('active');
        nextQ.style.display = 'block';
    }

    updateProgressDots(wrap);
    setNavButtons(wrap);
}

export function previousAboutQuestQuestion(): void {
    const wrap = getWrap();
    if (!wrap) return;

    const currentQ = wrap.querySelector<HTMLElement>(`.about-mobile-question[data-question="${currentQuestion}"]`);
    if (!currentQ) return;

    currentQ.classList.remove('active');
    currentQ.style.display = 'none';

    currentQuestion -= 1;
    const prevQ = wrap.querySelector<HTMLElement>(`.about-mobile-question[data-question="${currentQuestion}"]`);
    if (prevQ) {
        prevQ.classList.add('active');
        prevQ.style.display = 'block';
    }

    updateProgressDots(wrap);
    setNavButtons(wrap);
}

export function resetAboutContactQuest(): void {
    const wrap = getWrap();
    const form = document.getElementById('about-interactive-contact-form') as HTMLFormElement | null;
    if (form) form.reset();

    currentQuestion = 1;

    if (wrap) {
        wrap.querySelectorAll('.about-mobile-question').forEach((q) => {
            const el = q as HTMLElement;
            el.classList.remove('active');
            el.style.display = 'none';
        });

        wrap.querySelectorAll('.about-desktop-question').forEach((q) => {
            (q as HTMLElement).style.removeProperty('display');
        });

        const m1 = wrap.querySelector<HTMLElement>('.about-mobile-question[data-question="1"]');
        if (m1) {
            m1.classList.add('active');
            m1.style.display = 'block';
        }

        wrap.querySelectorAll('.about-mobile-question').forEach((q) => {
            const el = q as HTMLElement;
            if (el.dataset.question !== '1') el.style.display = 'none';
        });

        updateProgressDots(wrap);
        setNavButtons(wrap);

        const questForm = wrap.querySelector<HTMLElement>('.about-quest-form');
        const questIntro = wrap.querySelector<HTMLElement>('.about-quest-intro');
        const formSuccess = wrap.querySelector<HTMLElement>('#about-form-success');
        if (questForm) questForm.hidden = false;
        if (questIntro) questIntro.hidden = false;
        if (formSuccess) formSuccess.hidden = true;
    }
}

function syncDesktopMobileFields(form: HTMLFormElement) {
    const mirror = (aSel: string, bSel: string) => {
        const a = form.querySelector(aSel) as HTMLInputElement | HTMLTextAreaElement | null;
        const b = form.querySelector(bSel) as HTMLInputElement | HTMLTextAreaElement | null;
        if (!a || !b) return;
        if (a.value.trim()) b.value = a.value;
        else if (b.value.trim()) a.value = b.value;
    };
    mirror('textarea[name="about-message-desktop"]', 'textarea[name="about-message"]');
    mirror('input[name="about-name-desktop"]', 'input[name="about-name"]');
    mirror('input[name="about-email-desktop"]', 'input[name="about-email"]');
    mirror('input[name="about-organization-desktop"]', 'input[name="about-organization"]');
}

function labelForChecked(form: HTMLFormElement, name: string): string {
    const el = form.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`);
    if (!el) return '';
    const card = el.closest('label')?.querySelector('.about-option-card span');
    return card?.textContent?.trim() || el.value;
}

function selErrText(wrap: HTMLElement): string {
    const lang = state.currentLang === 'fr' ? 'fr' : 'en';
    const errEl = wrap.querySelector(`#about-quest-sel-err-msg`);
    if (errEl) {
        const t = errEl.getAttribute(`data-${lang}`) || errEl.getAttribute('data-en');
        if (t) return t;
    }
    return 'Please pick one answer for each question above.';
}

function errText(wrap: HTMLElement): string {
    const lang = state.currentLang === 'fr' ? 'fr' : 'en';
    const errEl = wrap.querySelector(`#about-quest-err-msg`);
    if (errEl) {
        const t = errEl.getAttribute(`data-${lang}`) || errEl.getAttribute('data-en');
        if (t) return t;
    }
    return 'Please fill in message, name, and email.';
}

export function initAboutContactQuest(): void {
    const wrap = getWrap();
    const form = document.getElementById('about-interactive-contact-form') as HTMLFormElement | null;
    if (!wrap || !form) return;

    const prevBtn = wrap.querySelector('#about-quest-prev-btn');
    const nextBtn = wrap.querySelector('#about-quest-next-btn');
    const resetBtn = wrap.querySelector('#about-quest-reset-btn');

    prevBtn?.addEventListener('click', () => previousAboutQuestQuestion());
    nextBtn?.addEventListener('click', () => nextAboutQuestQuestion());
    resetBtn?.addEventListener('click', () => resetAboutContactQuest());

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        syncDesktopMobileFields(form);

        const msg =
            (form.querySelector('textarea[name="about-message"]') as HTMLTextAreaElement | null)?.value.trim() ||
            (form.querySelector('textarea[name="about-message-desktop"]') as HTMLTextAreaElement | null)?.value.trim();
        const name =
            (form.querySelector('input[name="about-name"]') as HTMLInputElement | null)?.value.trim() ||
            (form.querySelector('input[name="about-name-desktop"]') as HTMLInputElement | null)?.value.trim();
        const email =
            (form.querySelector('input[name="about-email"]') as HTMLInputElement | null)?.value.trim() ||
            (form.querySelector('input[name="about-email-desktop"]') as HTMLInputElement | null)?.value.trim();

        if (!msg || !name || !email) {
            window.alert(errText(wrap));
            return;
        }

        const purpose = labelForChecked(form, 'about-purpose');
        const stance = labelForChecked(form, 'about-stance');
        const timeline = labelForChecked(form, 'about-timeline');

        if (!purpose || !stance || !timeline) {
            window.alert(selErrText(wrap));
            return;
        }

        const org =
            (form.querySelector('input[name="about-organization"]') as HTMLInputElement | null)?.value.trim() ||
            (form.querySelector('input[name="about-organization-desktop"]') as HTMLInputElement | null)?.value.trim();

        const lang = state.currentLang === 'fr' ? 'fr' : 'en';
        const subEl = wrap.querySelector(`#about-quest-mail-subject`);
        const subjectPrefix =
            subEl?.getAttribute(lang === 'fr' ? 'data-fr' : 'data-en') || subEl?.getAttribute('data-en') || 'TDT contact:';

        const qPurpose = wrap.querySelector(`[data-about-mail-key="purpose"]`);
        const qStance = wrap.querySelector(`[data-about-mail-key="stance"]`);
        const qTimeline = wrap.querySelector(`[data-about-mail-key="timeline"]`);
        const qName = wrap.querySelector(`[data-about-mail-key="name"]`);
        const qEmail = wrap.querySelector(`[data-about-mail-key="email"]`);
        const qOrg = wrap.querySelector(`[data-about-mail-key="org"]`);
        const qMsg = wrap.querySelector(`[data-about-mail-key="message"]`);

        const L = (el: Element | null) =>
            el?.getAttribute(lang === 'fr' ? 'data-fr' : 'data-en') || el?.getAttribute('data-en') || '';

        const emailBody =
            `${L(qPurpose)}: ${purpose}\n` +
            `${L(qStance)}: ${stance}\n` +
            `${L(qTimeline)}: ${timeline}\n` +
            `${L(qName)}: ${name}\n` +
            `${L(qEmail)}: ${email}\n` +
            `${L(qOrg)}: ${org || (lang === 'fr' ? 'N/A' : 'N/A')}\n\n` +
            `${L(qMsg)}:\n${msg}`;

        const subject = `${subjectPrefix} ${purpose}`;
        const mailtoHref =
            `mailto:${MAILTO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;

        void (async () => {
            /* Same Outpost POST as homepage form; Sheet column `source`: about_contact vs homepage_outpost. */
            try {
                const res = await subscribeOutpost(email, {
                    lang: state.currentLang,
                    source: NEWSLETTER_SOURCE_ABOUT_CONTACT,
                    honeypot: '',
                });
                if (!res.ok) {
                    console.warn('[About contact] newsletter row not written:', res.status);
                }
            } catch (err) {
                console.warn('[About contact] newsletter subscribe:', err);
            }

            window.location.href = mailtoHref;

            window.setTimeout(() => {
                const questForm = wrap.querySelector<HTMLElement>('.about-quest-form');
                const questIntro = wrap.querySelector<HTMLElement>('.about-quest-intro');
                const formSuccess = wrap.querySelector<HTMLElement>('#about-form-success');
                if (questForm) questForm.hidden = true;
                if (questIntro) questIntro.hidden = true;
                if (formSuccess) formSuccess.hidden = false;
            }, 400);
        })();
    });

    wrap.querySelectorAll<HTMLInputElement>('.about-mobile-question input[type="radio"]').forEach((radio) => {
        radio.addEventListener('change', () => {
            window.setTimeout(() => {
                if (window.innerWidth <= 768 && currentQuestion < 4) {
                    nextAboutQuestQuestion();
                }
            }, 280);
        });
    });

    const mobileMessage = form.querySelector<HTMLTextAreaElement>('textarea[name="about-message"]');
    if (mobileMessage) {
        let typingTimer = 0;
        mobileMessage.addEventListener('input', function (this: HTMLTextAreaElement) {
            window.clearTimeout(typingTimer);
            typingTimer = window.setTimeout(() => {
                if (window.innerWidth <= 768 && currentQuestion === 4 && this.value.trim().length > 12) {
                    nextAboutQuestQuestion();
                }
            }, 1900);
        });
    }

    const syncPairs: [string, string][] = [
        ['textarea[name="about-message-desktop"]', 'textarea[name="about-message"]'],
        ['input[name="about-name-desktop"]', 'input[name="about-name"]'],
        ['input[name="about-email-desktop"]', 'input[name="about-email"]'],
        ['input[name="about-organization-desktop"]', 'input[name="about-organization"]'],
    ];

    syncPairs.forEach(([aSel, bSel]) => {
        const a = form.querySelector(aSel) as HTMLInputElement | HTMLTextAreaElement | null;
        const b = form.querySelector(bSel) as HTMLInputElement | HTMLTextAreaElement | null;
        if (!a || !b) return;
        a.addEventListener('input', () => {
            b.value = a.value;
        });
        b.addEventListener('input', () => {
            a.value = b.value;
        });
    });

    updateProgressDots(wrap);
    setNavButtons(wrap);
}
