import { NewChatMembersProgress, RightColumnContent } from '../../types';
import { IS_SNAP_EFFECT_SUPPORTED } from '../../util/browser/windowEnvironment';
import { getCurrentTabId } from '../../util/establishMultitabRole';
import { getMessageVideo, getMessageWebPageVideo } from '../helpers/messageMedia';
import { selectCurrentManagement } from './management';
import { selectSharedSettings } from './sharedState';
import { selectIsStatisticsShown } from './statistics';
import { selectTabState } from './tabs';
export function selectIsMediaViewerOpen(global, ...[tabId = getCurrentTabId()]) {
    const { mediaViewer: { chatId, messageId, isAvatarView, standaloneMedia, isSponsoredMessage, }, } = selectTabState(global, tabId);
    return Boolean(standaloneMedia || (chatId && (isAvatarView || messageId || isSponsoredMessage)));
}
export function selectRightColumnContentKey(global, isMobile, ...[tabId = getCurrentTabId()]) {
    const tabState = selectTabState(global, tabId);
    return tabState.editTopicPanel ? (RightColumnContent.EditTopic) : tabState.createTopicPanel ? (RightColumnContent.CreateTopic) : tabState.pollResults.messageId ? (RightColumnContent.PollResults) : selectCurrentManagement(global, tabId) ? (RightColumnContent.Management) : tabState.isStatisticsShown && tabState.statistics.currentMessageId ? (RightColumnContent.MessageStatistics) : tabState.isStatisticsShown && tabState.statistics.currentStoryId ? (RightColumnContent.StoryStatistics) : selectIsStatisticsShown(global, tabId) ? (RightColumnContent.Statistics) : tabState.boostStatistics ? (RightColumnContent.BoostStatistics) : tabState.monetizationStatistics ? (RightColumnContent.MonetizationStatistics) : tabState.stickerSearch.query !== undefined ? (RightColumnContent.StickerSearch) : tabState.gifSearch.query !== undefined ? (RightColumnContent.GifSearch) : tabState.newChatMembersProgress !== NewChatMembersProgress.Closed ? (RightColumnContent.AddingMembers) : tabState.isChatInfoShown && tabState.messageLists.length ? (RightColumnContent.ChatInfo) : undefined;
}
export function selectIsRightColumnShown(global, isMobile, ...[tabId = getCurrentTabId()]) {
    return selectRightColumnContentKey(global, isMobile, tabId) !== undefined;
}
export function selectTheme(global) {
    return selectSharedSettings(global).theme;
}
export function selectThemeValues(global, themeKey) {
    return global.settings.themes[themeKey];
}
export function selectIsForumPanelOpen(global, ...[tabId = getCurrentTabId()]) {
    const tabState = selectTabState(global, tabId);
    return Boolean(tabState.forumPanelChatId) && (tabState.globalSearch.query === undefined || Boolean(tabState.globalSearch.isClosing));
}
export function selectIsForumPanelClosed(global, ...[tabId = getCurrentTabId()]) {
    return !selectIsForumPanelOpen(global, tabId);
}
export function selectIsReactionPickerOpen(global, ...[tabId = getCurrentTabId()]) {
    const { reactionPicker } = selectTabState(global, tabId);
    return Boolean(reactionPicker?.position);
}
export function selectPerformanceSettings(global) {
    return selectSharedSettings(global).performance;
}
export function selectPerformanceSettingsValue(global, key) {
    return selectPerformanceSettings(global)[key];
}
export function selectCanAutoPlayMedia(global, message) {
    const video = getMessageVideo(message) || getMessageWebPageVideo(message);
    if (!video) {
        return undefined;
    }
    const canAutoPlayVideos = selectPerformanceSettingsValue(global, 'autoplayVideos');
    const canAutoPlayGifs = selectPerformanceSettingsValue(global, 'autoplayGifs');
    const asGif = video.isGif || video.isRound;
    return (canAutoPlayVideos && !asGif) || (canAutoPlayGifs && asGif);
}
export function selectShouldLoopStickers(global) {
    return selectPerformanceSettingsValue(global, 'loopAnimatedStickers');
}
export function selectCanPlayAnimatedEmojis(global) {
    return selectPerformanceSettingsValue(global, 'animatedEmoji');
}
export function selectCanAnimateInterface(global) {
    return selectPerformanceSettingsValue(global, 'pageTransitions');
}
export function selectIsContextMenuTranslucent(global) {
    return selectPerformanceSettingsValue(global, 'contextMenuBlur');
}
export function selectIsSynced(global) {
    return global.isSynced;
}
export function selectCanAnimateSnapEffect(global) {
    return IS_SNAP_EFFECT_SUPPORTED && selectPerformanceSettingsValue(global, 'snapEffect');
}
export function selectWebApp(global, key, ...[tabId = getCurrentTabId()]) {
    return selectTabState(global, tabId).webApps.openedWebApps[key];
}
export function selectActiveWebApp(global, ...[tabId = getCurrentTabId()]) {
    const activeWebAppKey = selectTabState(global, tabId).webApps.activeWebAppKey;
    if (!activeWebAppKey)
        return undefined;
    return selectWebApp(global, activeWebAppKey, tabId);
}
export function selectLeftColumnContentKey(global, ...[tabId = getCurrentTabId()]) {
    return selectTabState(global, tabId).leftColumn.contentKey;
}
export function selectSettingsScreen(global, ...[tabId = getCurrentTabId()]) {
    return selectTabState(global, tabId).leftColumn.settingsScreen;
}
