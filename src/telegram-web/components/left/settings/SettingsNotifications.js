import { memo, useCallback, useEffect } from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';
import { checkIfNotificationsSupported, checkIfOfflinePushFailed, playNotifySound, } from '../../../util/notifications';
import useHistoryBack from '../../../hooks/useHistoryBack';
import useLang from '../../../hooks/useLang';
import useRunDebounced from '../../../hooks/useRunDebounced';
import Checkbox from '../../ui/Checkbox';
import RangeSlider from '../../ui/RangeSlider';
const SettingsNotifications = ({ isActive, onReset, notifyDefaults, hasContactJoinedNotifications, hasPushNotifications, hasWebNotifications, notificationSoundVolume, }) => {
    const { loadNotificationSettings, updateContactSignUpNotification, updateNotificationSettings, updateWebNotificationSettings, } = getActions();
    useEffect(() => {
        loadNotificationSettings();
    }, [loadNotificationSettings]);
    const runDebounced = useRunDebounced(500, true);
    const areNotificationsSupported = checkIfNotificationsSupported();
    const areOfflineNotificationsSupported = areNotificationsSupported && !checkIfOfflinePushFailed();
    const handleSettingsChange = useCallback((e, peerType, setting) => {
        const currentIsMuted = Boolean(notifyDefaults?.[peerType]?.mutedUntil);
        const currentShouldShowPreviews = Boolean(notifyDefaults?.[peerType]?.shouldShowPreviews);
        updateNotificationSettings({
            peerType,
            isMuted: setting === 'mute' ? !e.target.checked : currentIsMuted,
            shouldShowPreviews: setting === 'showPreviews' ? e.target.checked : currentShouldShowPreviews,
        });
    }, [notifyDefaults]);
    const handleWebNotificationsChange = useCallback((e) => {
        const isEnabled = e.target.checked;
        updateWebNotificationSettings({
            hasWebNotifications: isEnabled,
            ...(!isEnabled && { hasPushNotifications: false }),
        });
    }, [updateWebNotificationSettings]);
    const handlePushNotificationsChange = useCallback((e) => {
        updateWebNotificationSettings({
            hasPushNotifications: e.target.checked,
        });
    }, [updateWebNotificationSettings]);
    const handlePrivateChatsNotificationsChange = useCallback((e) => {
        handleSettingsChange(e, 'users', 'mute');
    }, [handleSettingsChange]);
    const handlePrivateChatsPreviewChange = useCallback((e) => {
        handleSettingsChange(e, 'users', 'showPreviews');
    }, [handleSettingsChange]);
    const handleGroupsNotificationsChange = useCallback((e) => {
        handleSettingsChange(e, 'groups', 'mute');
    }, [handleSettingsChange]);
    const handleGroupsPreviewChange = useCallback((e) => {
        handleSettingsChange(e, 'groups', 'showPreviews');
    }, [handleSettingsChange]);
    const handleChannelsNotificationsChange = useCallback((e) => {
        handleSettingsChange(e, 'channels', 'mute');
    }, [handleSettingsChange]);
    const handleChannelsPreviewChange = useCallback((e) => {
        handleSettingsChange(e, 'channels', 'showPreviews');
    }, [handleSettingsChange]);
    const handleContactNotificationChange = useCallback((e) => {
        updateContactSignUpNotification({
            isSilent: !e.target.checked,
        });
    }, [updateContactSignUpNotification]);
    const handleVolumeChange = useCallback((volume) => {
        updateWebNotificationSettings({
            notificationSoundVolume: volume,
        });
        runDebounced(() => playNotifySound(undefined, volume));
    }, [runDebounced, updateWebNotificationSettings]);
    const lang = useLang();
    useHistoryBack({
        isActive,
        onBack: onReset,
    });
    return (<div className="settings-content custom-scroll">
      <div className="settings-item">
        <h4 className="settings-item-header" dir={lang.isRtl ? 'rtl' : undefined}>
          {lang('NotificationsWeb')}
        </h4>
        <Checkbox label={lang('NotificationsWeb')} subLabel={lang(hasWebNotifications ? 'UserInfoNotificationsEnabled' : 'UserInfoNotificationsDisabled')} checked={hasWebNotifications} disabled={!areNotificationsSupported} onChange={handleWebNotificationsChange}/>
        <Checkbox label={lang('NotificationsOffline')} disabled={!hasWebNotifications || !areOfflineNotificationsSupported} subLabel={areOfflineNotificationsSupported
            ? lang(hasPushNotifications ? 'UserInfoNotificationsEnabled' : 'UserInfoNotificationsDisabled')
            : lang('SettingsOfflineNotificationUnsupported')} checked={hasPushNotifications} onChange={handlePushNotificationsChange}/>
        <div className="settings-item-slider">
          <RangeSlider label={lang('NotificationsSound')} min={0} max={10} disabled={!areNotificationsSupported} value={notificationSoundVolume} onChange={handleVolumeChange}/>
        </div>
      </div>
      <div className="settings-item">
        <h4 className="settings-item-header" dir={lang.isRtl ? 'rtl' : undefined}>
          {lang('AutodownloadPrivateChats')}
        </h4>

        <Checkbox label={lang('NotificationsForPrivateChats')} subLabel={lang(notifyDefaults?.users?.mutedUntil
            ? 'UserInfoNotificationsEnabled' : 'UserInfoNotificationsDisabled')} checked={Boolean(notifyDefaults?.users?.mutedUntil)} onChange={handlePrivateChatsNotificationsChange}/>
        <Checkbox label={lang('MessagePreview')} disabled={!notifyDefaults?.users?.mutedUntil} subLabel={lang(notifyDefaults?.users?.shouldShowPreviews
            ? 'UserInfoNotificationsEnabled' : 'UserInfoNotificationsDisabled')} checked={Boolean(notifyDefaults?.users?.shouldShowPreviews)} onChange={handlePrivateChatsPreviewChange}/>
      </div>

      <div className="settings-item">
        <h4 className="settings-item-header" dir={lang.isRtl ? 'rtl' : undefined}>{lang('FilterGroups')}</h4>

        <Checkbox label={lang('NotificationsForGroups')} subLabel={lang(notifyDefaults?.groups?.mutedUntil
            ? 'UserInfoNotificationsEnabled' : 'UserInfoNotificationsDisabled')} checked={Boolean(notifyDefaults?.groups?.mutedUntil)} onChange={handleGroupsNotificationsChange}/>
        <Checkbox label={lang('MessagePreview')} disabled={!notifyDefaults?.groups?.mutedUntil} subLabel={lang(notifyDefaults?.groups?.shouldShowPreviews
            ? 'UserInfoNotificationsEnabled' : 'UserInfoNotificationsDisabled')} checked={Boolean(notifyDefaults?.groups?.shouldShowPreviews)} onChange={handleGroupsPreviewChange}/>
      </div>

      <div className="settings-item">
        <h4 className="settings-item-header" dir={lang.isRtl ? 'rtl' : undefined}>{lang('FilterChannels')}</h4>

        <Checkbox label={lang('NotificationsForChannels')} subLabel={lang(notifyDefaults?.channels?.mutedUntil
            ? 'UserInfoNotificationsEnabled' : 'UserInfoNotificationsDisabled')} checked={Boolean(notifyDefaults?.channels?.mutedUntil)} onChange={handleChannelsNotificationsChange}/>
        <Checkbox label={lang('MessagePreview')} disabled={!notifyDefaults?.channels?.mutedUntil} subLabel={lang(notifyDefaults?.channels?.shouldShowPreviews
            ? 'UserInfoNotificationsEnabled' : 'UserInfoNotificationsDisabled')} checked={Boolean(notifyDefaults?.channels?.shouldShowPreviews)} onChange={handleChannelsPreviewChange}/>
      </div>

      <div className="settings-item">
        <h4 className="settings-item-header" dir={lang.isRtl ? 'rtl' : undefined}>{lang('PhoneOther')}</h4>

        <Checkbox label={lang('ContactJoined')} checked={hasContactJoinedNotifications} onChange={handleContactNotificationChange}/>
      </div>
    </div>);
};
export default memo(withGlobal((global) => {
    return {
        hasContactJoinedNotifications: Boolean(global.settings.byKey.hasContactJoinedNotifications),
        hasWebNotifications: global.settings.byKey.hasWebNotifications,
        hasPushNotifications: global.settings.byKey.hasPushNotifications,
        notificationSoundVolume: global.settings.byKey.notificationSoundVolume,
    };
})(SettingsNotifications));
