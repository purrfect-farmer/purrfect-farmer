import { getCurrentTabId } from '../../util/establishMultitabRole';
import { omit } from '../../util/iteratees';
import { selectMessageTranslations, selectTabState } from '../selectors';
import { updateTabState } from './tabs';
export function updateMessageTranslation(global, chatId, messageId, toLanguageCode, translation) {
    const translatedMessages = selectMessageTranslations(global, chatId, toLanguageCode);
    return {
        ...global,
        translations: {
            ...global.translations,
            byChatId: {
                ...global.translations.byChatId,
                [chatId]: {
                    ...global.translations.byChatId[chatId],
                    byLangCode: {
                        ...global.translations.byChatId[chatId]?.byLangCode,
                        [toLanguageCode]: {
                            ...translatedMessages,
                            [messageId]: {
                                ...translatedMessages[messageId],
                                ...translation,
                            },
                        },
                    },
                },
            },
        },
    };
}
export function clearMessageTranslation(global, chatId, messageId) {
    const chatTranslations = global.translations.byChatId[chatId];
    if (!chatTranslations)
        return global;
    const { byLangCode } = chatTranslations;
    const newByLangCode = Object.keys(byLangCode).reduce((acc, langCode) => {
        const newTranslatedMessages = omit(byLangCode[langCode], [messageId]);
        if (Object.keys(newTranslatedMessages).length) {
            acc[langCode] = newTranslatedMessages;
        }
        return acc;
    }, {});
    return {
        ...global,
        translations: {
            ...global.translations,
            byChatId: {
                ...global.translations.byChatId,
                [chatId]: {
                    ...chatTranslations,
                    byLangCode: newByLangCode,
                },
            },
        },
    };
}
export function updateMessageTranslations(global, chatId, messageIds, toLanguageCode, translations) {
    messageIds.forEach((messageId, index) => {
        global = updateMessageTranslation(global, chatId, messageId, toLanguageCode, {
            text: translations[index],
            isPending: false,
        });
    });
    return global;
}
export function updateRequestedChatTranslation(global, chatId, toLanguageCode, ...[tabId = getCurrentTabId()]) {
    const tabState = selectTabState(global, tabId);
    global = updateTabState(global, {
        requestedTranslations: {
            ...tabState.requestedTranslations,
            byChatId: {
                ...tabState.requestedTranslations.byChatId,
                [chatId]: {
                    toLanguage: toLanguageCode,
                },
            },
        },
    }, tabId);
    return global;
}
export function removeRequestedChatTranslation(global, chatId, ...[tabId = getCurrentTabId()]) {
    const tabState = selectTabState(global, tabId);
    global = updateTabState(global, {
        requestedTranslations: {
            ...tabState.requestedTranslations,
            byChatId: omit(tabState.requestedTranslations.byChatId, [chatId]),
        },
    }, tabId);
    return global;
}
export function updateRequestedMessageTranslation(global, chatId, messageId, toLanguageCode, ...[tabId = getCurrentTabId()]) {
    const tabState = selectTabState(global, tabId);
    global = updateTabState(global, {
        requestedTranslations: {
            ...tabState.requestedTranslations,
            byChatId: {
                ...tabState.requestedTranslations.byChatId,
                [chatId]: {
                    ...tabState.requestedTranslations.byChatId[chatId],
                    manualMessages: {
                        ...tabState.requestedTranslations.byChatId[chatId]?.manualMessages,
                        [messageId]: toLanguageCode,
                    },
                },
            },
        },
    }, tabId);
    return global;
}
export function removeRequestedMessageTranslation(global, chatId, messageId, ...[tabId = getCurrentTabId()]) {
    const tabState = selectTabState(global, tabId);
    const manualMessages = tabState.requestedTranslations.byChatId[chatId]?.manualMessages;
    if (!manualMessages)
        return global;
    const newManualMessages = omit(manualMessages, [messageId]);
    global = updateTabState(global, {
        requestedTranslations: {
            ...tabState.requestedTranslations,
            byChatId: {
                ...tabState.requestedTranslations.byChatId,
                [chatId]: {
                    ...tabState.requestedTranslations.byChatId[chatId],
                    manualMessages: newManualMessages,
                },
            },
        },
    }, tabId);
    return global;
}
