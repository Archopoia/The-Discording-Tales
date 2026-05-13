// ========================================
// COPYRIGHT PROTECTION
// Discourage casual copying of game content
// ========================================
export function initCopyrightProtection(): void {
    document.addEventListener('contextmenu', function (e) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'A') {
            return;
        }
        if (target.closest('.section-content, .tab-content, .lore-section, .discovery-unified-section, .rules-content')) {
            e.preventDefault();
        }
    });

    document.addEventListener('copy', function (e) {
        const selection = window.getSelection();
        if (selection && selection.toString().length > 50) {
            const copiedText = selection.toString();
            const canonical =
                typeof document !== 'undefined'
                    ? document.querySelector('link[rel="canonical"]')?.getAttribute('href')?.trim()
                    : '';
            const sourceLine = canonical ? `Source: ${canonical}\n` : '';
            const watermark =
                '\n\n---\n© 2020-2026 The Discording Tales / Des Récits Discordants. All Rights Reserved.\n' +
                sourceLine +
                'Unauthorized reproduction is prohibited.\n---';
            if (e.clipboardData) {
                e.clipboardData.setData('text/plain', copiedText + watermark);
                e.preventDefault();
            }
        }
    });

    document.addEventListener('dragstart', function (e) {
        if ((e.target as HTMLElement).tagName === 'IMG') {
            e.preventDefault();
        }
    });

    document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
        }
    });

    if (typeof console !== 'undefined' && console.log) {
        console.log(
            '%c⚠ COPYRIGHT NOTICE',
            'color: #740000; font-size: 18px; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);'
        );
        console.log(
            '%c© 2020-2026 The Discording Tales / Des Récits Discordants. All Rights Reserved.\n' +
                'All content, artwork, game mechanics, lore, names, and creative materials\n' +
                'are protected by international copyright law.\n' +
                'No reproduction, distribution, or derivative works permitted without\n' +
                'express written permission.\n' +
                'AI/ML training on this content is strictly prohibited.',
            'color: #333; font-size: 12px;'
        );
    }
}
