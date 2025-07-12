import { getCurrentTabId } from '../../util/establishMultitabRole';
import { getWebAppKey } from '../helpers/bots';
import { selectActiveWebApp, selectTabState } from '../selectors';
import { updateTabState } from './tabs';
export function replaceInlineBotSettings(global, username, inlineBotSettings, ...[tabId = getCurrentTabId()]) {
    const tabState = selectTabState(global, tabId);
    return updateTabState(global, {
        inlineBots: {
            ...tabState.inlineBots,
            byUsername: {
                ...tabState.inlineBots.byUsername,
                [username]: inlineBotSettings,
            },
        },
    }, tabId);
}
export function replaceInlineBotsIsLoading(global, isLoading, ...[tabId = getCurrentTabId()]) {
    return updateTabState(global, {
        inlineBots: {
            ...selectTabState(global, tabId).inlineBots,
            isLoading,
        },
    }, tabId);
}
export function updateWebApp(global, key, webAppUpdate, ...[tabId = getCurrentTabId()]) {
    const currentTabState = selectTabState(global, tabId);
    const openedWebApps = currentTabState.webApps.openedWebApps;
    const originalWebApp = openedWebApps[key];
    if (!originalWebApp)
        return global;
    const updatedValue = {
        ...originalWebApp,
        ...webAppUpdate,
    };
    const updatedWebAppKey = getWebAppKey(updatedValue);
    if (!updatedWebAppKey)
        return global;
    global = updateTabState(global, {
        webApps: {
            ...currentTabState.webApps,
            openedWebApps: {
                ...openedWebApps,
                [updatedWebAppKey]: updatedValue,
            },
        },
    }, tabId);
    return global;
}
export function activateWebAppIfOpen(global, webAppKey, ...[tabId = getCurrentTabId()]) {
    const currentTabState = selectTabState(global, tabId);
    const openedWebApps = currentTabState.webApps.openedWebApps;
    if (!openedWebApps[webAppKey]) {
        return global;
    }
    global = updateTabState(global, {
        webApps: {
            ...currentTabState.webApps,
            isMoreAppsTabActive: false,
            activeWebAppKey: webAppKey,
            modalState: 'maximized',
        },
    }, tabId);
    return global;
}
export function addWebAppToOpenList(global, webApp, makeActive = true, openModalIfNotOpen = true, ...[tabId = getCurrentTabId()]) {
    const currentTabState = selectTabState(global, tabId);
    const key = getWebAppKey(webApp);
    if (!key)
        return global;
    const newOpenedKeys = [...currentTabState.webApps.openedOrderedKeys];
    if (!newOpenedKeys.includes(key))
        newOpenedKeys.push(key);
    const newSessionKeys = [...currentTabState.webApps.sessionKeys];
    if (!newSessionKeys.includes(key))
        newSessionKeys.push(key);
    const openedWebApps = currentTabState.webApps.openedWebApps;
    global = updateTabState(global, {
        webApps: {
            ...currentTabState.webApps,
            ...makeActive && { activeWebAppKey: key },
            isMoreAppsTabActive: false,
            isModalOpen: openModalIfNotOpen,
            modalState: 'maximized',
            openedWebApps: {
                ...openedWebApps,
                [key]: webApp,
            },
            openedOrderedKeys: newOpenedKeys,
            sessionKeys: newSessionKeys,
        },
    }, tabId);
    return global;
}
export function removeActiveWebAppFromOpenList(global, ...[tabId = getCurrentTabId()]) {
    const currentTabState = selectTabState(global, tabId);
    const activeWebAppKey = currentTabState.webApps.activeWebAppKey;
    if (!activeWebAppKey)
        return global;
    return removeWebAppFromOpenList(global, activeWebAppKey, false, tabId);
}
export function removeWebAppFromOpenList(global, key, skipClosingConfirmation, ...[tabId = getCurrentTabId()]) {
    const currentTabState = selectTabState(global, tabId);
    const { openedWebApps, openedOrderedKeys, activeWebAppKey } = currentTabState.webApps;
    const webApp = openedWebApps[key];
    if (!webApp)
        return global;
    if (!skipClosingConfirmation && webApp.shouldConfirmClosing) {
        return updateWebApp(global, key, { isCloseModalOpen: true }, tabId);
    }
    const updatedOpenedWebApps = { ...openedWebApps };
    const removingWebAppKey = getWebAppKey(webApp);
    let newOpenedKeys = openedOrderedKeys;
    if (removingWebAppKey) {
        delete updatedOpenedWebApps[removingWebAppKey];
        newOpenedKeys = openedOrderedKeys.filter((k) => k !== removingWebAppKey);
    }
    const isRemovedAppActive = activeWebAppKey === getWebAppKey(webApp);
    const openedWebAppsKeys = Object.keys(updatedOpenedWebApps);
    const openedWebAppsCount = openedWebAppsKeys.length;
    global = updateTabState(global, {
        webApps: {
            ...currentTabState.webApps,
            ...isRemovedAppActive && {
                activeWebAppKey: openedWebAppsCount
                    ? openedWebAppsKeys[openedWebAppsCount - 1] : undefined,
            },
            openedWebApps: updatedOpenedWebApps,
            openedOrderedKeys: newOpenedKeys,
            ...!openedWebAppsCount && {
                sessionKeys: [],
            },
        },
    }, tabId);
    return global;
}
export function clearOpenedWebApps(global, ...[tabId = getCurrentTabId()]) {
    const currentTabState = selectTabState(global, tabId);
    const webAppsNotAllowedToClose = Object.fromEntries(Object.entries(currentTabState.webApps.openedWebApps).filter(([, webApp]) => webApp.shouldConfirmClosing));
    const webAppsNotAllowedToCloseValues = Object.values(webAppsNotAllowedToClose);
    const hasNotAllowedToCloseApps = webAppsNotAllowedToCloseValues.length > 0;
    if (!hasNotAllowedToCloseApps) {
        return updateTabState(global, {
            webApps: {
                ...currentTabState.webApps,
                activeWebAppKey: undefined,
                openedWebApps: {},
                openedOrderedKeys: [],
                sessionKeys: [],
            },
        }, tabId);
    }
    const currentActiveWebApp = selectActiveWebApp(global, tabId);
    const newActiveWebApp = currentActiveWebApp?.shouldConfirmClosing
        ? currentActiveWebApp : webAppsNotAllowedToCloseValues[0];
    const newActiveWebAppKey = getWebAppKey(newActiveWebApp);
    if (newActiveWebAppKey) {
        webAppsNotAllowedToClose[newActiveWebAppKey] = {
            ...newActiveWebApp,
            isCloseModalOpen: true,
        };
    }
    const newOpenedKeys = currentTabState.webApps.openedOrderedKeys.filter((k) => webAppsNotAllowedToClose[k]);
    return updateTabState(global, {
        webApps: {
            ...currentTabState.webApps,
            activeWebAppKey: newActiveWebAppKey,
            isMoreAppsTabActive: false,
            openedWebApps: webAppsNotAllowedToClose,
            openedOrderedKeys: newOpenedKeys,
        },
    }, tabId);
}
export function hasOpenedWebApps(global, ...[tabId = getCurrentTabId()]) {
    return Object.keys(selectTabState(global, tabId).webApps.openedWebApps).length > 0;
}
export function hasOpenedMoreThanOneWebApps(global, ...[tabId = getCurrentTabId()]) {
    return Object.keys(selectTabState(global, tabId).webApps.openedWebApps).length > 1;
}
export function replaceWebAppModalState(global, modalState, ...[tabId = getCurrentTabId()]) {
    const currentTabState = selectTabState(global, tabId);
    return updateTabState(global, {
        webApps: {
            ...currentTabState.webApps,
            modalState,
        },
    }, tabId);
}
export function replaceIsWebAppModalOpen(global, value, ...[tabId = getCurrentTabId()]) {
    const currentTabState = selectTabState(global, tabId);
    return updateTabState(global, {
        webApps: {
            ...currentTabState.webApps,
            isModalOpen: value,
        },
    }, tabId);
}
