import { getActions } from '../global';
import { PRODUCTION_HOSTNAME, WEB_VERSION_BASE } from '../config';
import { clearWebsync } from './websync';
const SEARCH_ENGINE_REGEX = /(^|\.)(google|bing|duckduckgo|ya|yandex)\./i;
// Handled by the legacy version. Cannot be updated
const PERMANENT_VERSION_KEY = 'kz_version';
const CLIENT_VERSION = 'Z';
function setPermanentWebVersion(version) {
    localStorage.setItem(PERMANENT_VERSION_KEY, JSON.stringify(version));
}
export function getPermanentWebVersion() {
    const version = localStorage.getItem(PERMANENT_VERSION_KEY);
    if (version) {
        return JSON.parse(version);
    }
    return undefined;
}
export function switchPermanentWebVersion(version) {
    setPermanentWebVersion(version);
    clearWebsync();
    getActions().skipLockOnUnload();
    window.location.assign(`${WEB_VERSION_BASE}${version.toLowerCase()}`);
}
export function checkAndAssignPermanentWebVersion() {
    if (window.location.hostname !== PRODUCTION_HOSTNAME)
        return;
    const referrer = document.referrer.toLowerCase();
    if (!referrer)
        return;
    try {
        const isSearchEngine = new URL(referrer).host.match(SEARCH_ENGINE_REGEX);
        if (!isSearchEngine)
            return;
        const currentVersion = getPermanentWebVersion();
        if (currentVersion) {
            if (currentVersion !== CLIENT_VERSION) {
                switchPermanentWebVersion(currentVersion);
            }
            return;
        }
        const urlParams = new URLSearchParams(window.location.search);
        const hasTest = (urlParams.get('test') ?? undefined) !== undefined;
        const shouldRedirect = Math.random() < 0.5;
        if (hasTest || !shouldRedirect) {
            setPermanentWebVersion('Z');
            return;
        }
        switchPermanentWebVersion('K');
    }
    catch (e) {
        // Ignore
    }
}
