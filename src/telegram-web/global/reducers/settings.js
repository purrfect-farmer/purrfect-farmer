import { selectSharedSettings } from '../selectors/sharedState';
import { updateSharedState } from './sharedState';
import { updateUserBlockedState } from './users';
export function replaceSettings(global, newSettings) {
    return {
        ...global,
        settings: {
            ...global.settings,
            byKey: {
                ...global.settings.byKey,
                ...newSettings,
            },
        },
    };
}
export function updateSharedSettings(global, newSettings) {
    const settings = selectSharedSettings(global);
    return updateSharedState(global, {
        settings: {
            ...settings,
            ...newSettings,
        },
    });
}
export function updateThemeSettings(global, theme, newSettings) {
    const settings = global.settings;
    const current = settings.themes[theme];
    return {
        ...global,
        settings: {
            ...global.settings,
            themes: {
                ...settings.themes,
                [theme]: {
                    ...current,
                    ...newSettings,
                },
            },
        },
    };
}
export function addNotifyExceptions(global, notifyExceptionById) {
    return {
        ...global,
        chats: {
            ...global.chats,
            notifyExceptionById: {
                ...global.chats.notifyExceptionById,
                ...notifyExceptionById,
            },
        },
    };
}
export function replaceNotifyExceptions(global, notifyExceptionById) {
    return {
        ...global,
        chats: {
            ...global.chats,
            notifyExceptionById,
        },
    };
}
export function addNotifyException(global, id, notifyException) {
    return {
        ...global,
        chats: {
            ...global.chats,
            notifyExceptionById: {
                ...global.chats.notifyExceptionById,
                [id]: notifyException,
            },
        },
    };
}
export function updateNotifyDefaults(global, peerType, settings) {
    return {
        ...global,
        settings: {
            ...global.settings,
            notifyDefaults: {
                ...global.settings.notifyDefaults,
                [peerType]: {
                    ...global.settings.notifyDefaults?.[peerType],
                    ...settings,
                },
            },
        },
    };
}
export function addBlockedUser(global, contactId) {
    global = updateUserBlockedState(global, contactId, true);
    return {
        ...global,
        blocked: {
            ...global.blocked,
            ids: [contactId, ...global.blocked.ids],
            totalCount: global.blocked.totalCount + 1,
        },
    };
}
export function removeBlockedUser(global, contactId) {
    global = updateUserBlockedState(global, contactId, false);
    return {
        ...global,
        blocked: {
            ...global.blocked,
            ids: global.blocked.ids.filter((id) => id !== contactId),
            totalCount: global.blocked.totalCount - 1,
        },
    };
}
