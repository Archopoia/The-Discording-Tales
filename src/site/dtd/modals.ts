// @ts-nocheck
import { state } from './context';

/** Set true to restore nav button → PDF disclosure modal + download. */
export const PDF_BOOK_NAV_DOWNLOAD_ENABLED = false;

const KICKSTARTER_PRELAUNCH_URL =
    'https://www.kickstarter.com/projects/1410517588/the-discording-tales-tabletop-rpg-and-worldlore';

// ========================================
// PDF book download (disclosure dialog)
// ========================================
export function initPdfDownloadModal() {
    var openBtn = document.getElementById('tdt-open-pdf-modal');
    var dialog = document.getElementById('tdt-pdf-download-dialog');
    var closeBtn = document.getElementById('tdt-pdf-modal-close');
    var downloadBtn = document.getElementById('tdt-pdf-modal-download');
    if (!openBtn || !dialog) return;

    var pdfFileName = 'Des Récits Discordants v0.01.pdf';
    var pdfHref = 'assets/' + encodeURIComponent(pdfFileName);

    function triggerPdfDownload() {
        var a = document.createElement('a');
        a.href = pdfHref;
        a.setAttribute('download', pdfFileName);
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function openPdfDisclosureModal() {
        if (typeof dialog.showModal === 'function') {
            dialog.showModal();
        } else if (window.confirm('This PDF is French-only and a pre-release draft (CC BY-NC-SA 4.0). Download now?')) {
            triggerPdfDownload();
        }
    }

    openBtn.addEventListener('click', function() {
        if (!PDF_BOOK_NAV_DOWNLOAD_ENABLED) {
            window.open(KICKSTARTER_PRELAUNCH_URL, '_blank', 'noopener,noreferrer');
            return;
        }
        openPdfDisclosureModal();
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            if (typeof dialog.close === 'function') dialog.close();
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            triggerPdfDownload();
            if (typeof dialog.close === 'function') dialog.close();
        });
    }

    dialog.addEventListener('click', function(e) {
        if (e.target === dialog && typeof dialog.close === 'function') {
            dialog.close();
        }
    });
}

// ========================================
// Contact modal (mailto via default mail app)
// ========================================
export function initContactModal() {
    var openBtn = document.getElementById('tdt-open-contact-modal');
    var dialog = document.getElementById('tdt-contact-dialog');
    var closeBtn = document.getElementById('tdt-contact-modal-close');
    var form = document.getElementById('tdt-contact-form');
    var errEl = document.getElementById('tdt-contact-err-msg');
    if (!openBtn || !dialog || !form) return;

    var mailTo = 'thediscordingtales@gmail.com';

    function contactErrMsg() {
        if (!errEl) return 'Please fill in subject and message.';
        var lang = (typeof state !== 'undefined' && state.currentLang) ? state.currentLang : 'en';
        return errEl.getAttribute('data-' + lang) || errEl.getAttribute('data-en') || 'Please fill in subject and message.';
    }

    openBtn.addEventListener('click', function() {
        if (typeof dialog.showModal === 'function') {
            dialog.showModal();
            try {
                var sub = document.getElementById('tdt-contact-subject');
                if (sub) sub.focus();
            } catch (e) {}
        } else {
            window.location.href = 'mailto:' + mailTo;
        }
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            if (typeof dialog.close === 'function') dialog.close();
        });
    }

    dialog.addEventListener('click', function(e) {
        if (e.target === dialog && typeof dialog.close === 'function') {
            dialog.close();
        }
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        var nameEl = document.getElementById('tdt-contact-name');
        var subEl = document.getElementById('tdt-contact-subject');
        var bodyEl = document.getElementById('tdt-contact-body');
        var name = nameEl ? nameEl.value.trim() : '';
        var subject = subEl ? subEl.value.trim() : '';
        var body = bodyEl ? bodyEl.value.trim() : '';
        if (!subject || !body) {
            if (errEl) {
                errEl.removeAttribute('hidden');
                errEl.textContent = contactErrMsg();
            } else {
                window.alert(contactErrMsg());
            }
            return;
        }
        if (errEl) errEl.setAttribute('hidden', 'hidden');
        var composed = body;
        if (name) {
            composed = 'From: ' + name + '\n\n' + composed;
        }
        var href = 'mailto:' + mailTo + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(composed);
        window.location.href = href;
        if (typeof dialog.close === 'function') {
            dialog.close();
        }
        form.reset();
    });
}
