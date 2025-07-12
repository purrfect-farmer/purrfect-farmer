import { ACCOUNT_SLOT, getAccountsInfo } from '../../util/multiaccount';
import { selectSharedSettings } from './sharedState';
export function selectNotifySettings(global) {
    return global.settings.byKey;
}
export function selectNotifyDefaults(global) {
    return global.settings.notifyDefaults;
}
export function selectNotifyException(global, chatId) {
    return global.chats.notifyExceptionById?.[chatId];
}
export function selectLanguageCode(global) {
    return selectSharedSettings(global).language.replace('-raw', '');
}
export function selectCanSetPasscode(global) {
    // TODO[passcode]: remove this when multiacc passcode is implemented
    const accounts = getAccountsInfo();
    return global.authRememberMe && !ACCOUNT_SLOT && Object.keys(accounts).length === 1;
}
export function selectTranslationLanguage(global) {
    return global.settings.byKey.translationLanguage || selectLanguageCode(global);
}
export function selectNewNoncontactPeersRequirePremium(global) {
    return global.settings.byKey.shouldNewNonContactPeersRequirePremium;
}
export function selectNonContactPeersPaidStars(global) {
    return global.settings.byKey.nonContactPeersPaidStars;
}
export function selectShouldHideReadMarks(global) {
    return global.settings.byKey.shouldHideReadMarks;
}
export function selectSettingsKeys(global) {
    return global.settings.byKey;
}
