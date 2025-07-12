import { isUserBot } from '../helpers';
export function selectUser(global, userId) {
    return global.users.byId[userId];
}
export function selectUserStatus(global, userId) {
    return global.users.statusesById[userId];
}
export function selectUserFullInfo(global, userId) {
    return global.users.fullInfoById[userId];
}
export function selectUserCommonChats(global, userId) {
    return global.users.commonChatsById[userId];
}
export function selectIsUserBlocked(global, userId) {
    return selectUserFullInfo(global, userId)?.isBlocked;
}
export function selectIsCurrentUserPremium(global) {
    if (!global.currentUserId)
        return false;
    return Boolean(global.users.byId[global.currentUserId].isPremium);
}
export function selectIsCurrentUserFrozen(global) {
    return Boolean(global.appConfig?.freezeUntilDate);
}
export function selectIsPremiumPurchaseBlocked(global) {
    return global.appConfig?.isPremiumPurchaseBlocked ?? true;
}
export function selectIsGiveawayGiftsPurchaseAvailable(global) {
    return global.appConfig?.isGiveawayGiftsPurchaseAvailable ?? true;
}
/**
 * Slow, not to be used in `withGlobal`
 */
export function selectUserByPhoneNumber(global, phoneNumber) {
    const phoneNumberCleaned = phoneNumber.replace(/[^0-9]/g, '');
    return Object.values(global.users.byId).find((user) => user?.phoneNumber === phoneNumberCleaned);
}
export function selectBot(global, userId) {
    const user = selectUser(global, userId);
    if (!user || !isUserBot(user)) {
        return undefined;
    }
    return user;
}
export function selectBotAppPermissions(global, userId) {
    return global.users.botAppPermissionsById[userId];
}
