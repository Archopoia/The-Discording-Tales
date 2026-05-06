import { ARCHIVED_SUBTABS, FIRST_NON_ARCHIVED } from './archive-constants';
import { switchTab } from './tabs';
import { switchSubTab } from './subtabs';

export function setArchivedVisible(show: boolean): void {
    const key = 'drd_archived_visible';
    localStorage.setItem(key, show ? 'true' : 'false');
    if (show) {
        document.body.classList.remove('archived-hidden');
    } else {
        document.body.classList.add('archived-hidden');
        const activeTab = document.querySelector('.tab-content.active') as HTMLElement | null;
        const tabId = activeTab ? activeTab.id : null;
        if (tabId && ARCHIVED_SUBTABS[tabId]) {
            const activeLink = activeTab!.querySelector('.tab-sub-nav-link.active');
            const activeSubId =
                activeLink && activeLink.getAttribute('href') ? activeLink.getAttribute('href')!.replace('#', '') : '';
            if (ARCHIVED_SUBTABS[tabId].indexOf(activeSubId) !== -1) {
                switchSubTab(tabId, FIRST_NON_ARCHIVED[tabId]!);
            }
        }
    }
}

export function initArchiveToggle(): void {
    const key = 'drd_archived_visible';
    const stored = localStorage.getItem(key);
    const showArchived = stored === 'true';
    if (!showArchived) {
        document.body.classList.add('archived-hidden');
        const activeTab = document.querySelector('.tab-content.active') as HTMLElement | null;
        if (activeTab && (activeTab.id === 'lore' || activeTab.id === 'rules')) {
            switchTab('univers');
            switchSubTab('univers', 'peoples');
        }
    } else {
        document.body.classList.remove('archived-hidden');
    }
    document.addEventListener('keydown', function (e) {
        if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
            e.preventDefault();
            const archivedHidden = document.body.classList.contains('archived-hidden');
            setArchivedVisible(archivedHidden);
        }
    });
}
