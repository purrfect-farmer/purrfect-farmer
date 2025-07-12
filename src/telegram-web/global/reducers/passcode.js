import { INITIAL_GLOBAL_STATE, INITIAL_SHARED_STATE, INITIAL_TAB_STATE } from '../initialState';
export function updatePasscodeSettings(global, update) {
    return {
        ...global,
        passcode: {
            ...global.passcode,
            ...update,
        },
    };
}
export function clearPasscodeSettings(global) {
    return {
        ...global,
        passcode: {},
    };
}
export function clearGlobalForLockScreen(global, withTabState = true) {
    return {
        ...INITIAL_GLOBAL_STATE,
        passcode: global.passcode,
        settings: INITIAL_GLOBAL_STATE.settings,
        sharedState: clearSharedStateForLockScreen(global.sharedState),
        ...(withTabState && {
            byTabId: Object.values(global.byTabId).reduce((acc, { id: tabId, isMasterTab }) => {
                acc[tabId] = { ...INITIAL_TAB_STATE, isMasterTab, id: tabId };
                return acc;
            }, {}),
        }),
    };
}
export function clearSharedStateForLockScreen(sharedState) {
    const { theme, shouldUseSystemTheme, animationLevel, language, } = sharedState.settings;
    return {
        ...INITIAL_SHARED_STATE,
        settings: {
            ...INITIAL_SHARED_STATE.settings,
            theme,
            shouldUseSystemTheme,
            animationLevel,
            language,
        },
    };
}
