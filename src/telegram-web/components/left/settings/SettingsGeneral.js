import { memo, useCallback, useEffect, useState, } from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';
import { SettingsScreens } from '../../../types';
import { selectSharedSettings } from '../../../global/selectors/sharedState';
import { IS_ANDROID, IS_ELECTRON, IS_IOS, IS_MAC_OS, IS_WINDOWS, } from '../../../util/browser/windowEnvironment';
import { setTimeFormat } from '../../../util/oldLangProvider';
import { getSystemTheme } from '../../../util/systemTheme';
import useAppLayout from '../../../hooks/useAppLayout';
import useHistoryBack from '../../../hooks/useHistoryBack';
import useLang from '../../../hooks/useLang';
import Checkbox from '../../ui/Checkbox';
import ListItem from '../../ui/ListItem';
import RadioGroup from '../../ui/RadioGroup';
import RangeSlider from '../../ui/RangeSlider';
const SettingsGeneral = ({ isActive, messageTextSize, messageSendKeyCombo, timeFormat, theme, shouldUseSystemTheme, onReset, }) => {
    const { setSharedSettingOption, openSettingsScreen, } = getActions();
    const lang = useLang();
    const { isMobile } = useAppLayout();
    const isMobileDevice = isMobile && (IS_IOS || IS_ANDROID);
    const timeFormatOptions = [{
            label: lang('SettingsTimeFormat12'),
            value: '12h',
        }, {
            label: lang('SettingsTimeFormat24'),
            value: '24h',
        }];
    const appearanceThemeOptions = [{
            label: lang('EmptyChatAppearanceLight'),
            value: 'light',
        }, {
            label: lang('EmptyChatAppearanceDark'),
            value: 'dark',
        }, {
            label: lang('EmptyChatAppearanceSystem'),
            value: 'auto',
        }];
    const keyboardSendOptions = !isMobileDevice ? [
        { value: 'enter', label: lang('SettingsSendEnter'), subLabel: lang('SettingsSendEnterDescription') },
        {
            value: 'ctrl-enter',
            label: lang(IS_MAC_OS || IS_IOS ? 'SettingsSendCmdenter' : 'SettingsSendCtrlenter'),
            subLabel: lang('SettingsSendPlusEnterDescription'),
        },
    ] : undefined;
    const handleMessageTextSizeChange = useCallback((newSize) => {
        document.documentElement.style.setProperty('--composer-text-size', `${Math.max(newSize, IS_IOS ? 16 : 15)}px`);
        document.documentElement.style.setProperty('--message-meta-height', `${Math.floor(newSize * 1.3125)}px`);
        document.documentElement.style.setProperty('--message-text-size', `${newSize}px`);
        document.documentElement.setAttribute('data-message-text-size', newSize.toString());
        setSharedSettingOption({ messageTextSize: newSize });
    }, []);
    const handleAppearanceThemeChange = useCallback((value) => {
        const newTheme = value === 'auto' ? getSystemTheme() : value;
        setSharedSettingOption({ theme: newTheme });
        setSharedSettingOption({ shouldUseSystemTheme: value === 'auto' });
    }, []);
    const handleTimeFormatChange = useCallback((newTimeFormat) => {
        setSharedSettingOption({ timeFormat: newTimeFormat });
        setSharedSettingOption({ wasTimeFormatSetManually: true });
        setTimeFormat(newTimeFormat);
    }, []);
    const handleMessageSendComboChange = useCallback((newCombo) => {
        setSharedSettingOption({ messageSendKeyCombo: newCombo });
    }, []);
    const [isTrayIconEnabled, setIsTrayIconEnabled] = useState(false);
    useEffect(() => {
        window.electron?.getIsTrayIconEnabled().then(setIsTrayIconEnabled);
    }, []);
    const handleIsTrayIconEnabledChange = useCallback((isChecked) => {
        window.electron?.setIsTrayIconEnabled(isChecked);
    }, []);
    useHistoryBack({
        isActive,
        onBack: onReset,
    });
    return (<div className="settings-content custom-scroll">
      <div className="settings-item">
        <h4 className="settings-item-header" dir={lang.isRtl ? 'rtl' : undefined}>{lang('Settings')}</h4>

        <RangeSlider label={lang('TextSize')} min={12} max={20} value={messageTextSize} onChange={handleMessageTextSizeChange}/>

        <ListItem icon="photo" narrow onClick={() => openSettingsScreen({ screen: SettingsScreens.GeneralChatBackground })}>
          {lang('ChatBackground')}
        </ListItem>

        {IS_ELECTRON && IS_WINDOWS && (<Checkbox label={lang('SettingsTray')} checked={Boolean(isTrayIconEnabled)} onCheck={handleIsTrayIconEnabledChange}/>)}
      </div>

      <div className="settings-item">
        <h4 className="settings-item-header" dir={lang.isRtl ? 'rtl' : undefined}>
          {lang('Theme')}
        </h4>
        <RadioGroup name="theme" options={appearanceThemeOptions} selected={shouldUseSystemTheme ? 'auto' : theme} onChange={handleAppearanceThemeChange}/>
      </div>

      <div className="settings-item">
        <h4 className="settings-item-header" dir={lang.isRtl ? 'rtl' : undefined}>
          {lang('SettingsTimeFormat')}
        </h4>
        <RadioGroup name="timeformat" options={timeFormatOptions} selected={timeFormat} onChange={handleTimeFormatChange}/>
      </div>

      {keyboardSendOptions && (<div className="settings-item">
          <h4 className="settings-item-header" dir={lang.isRtl ? 'rtl' : undefined}>{lang('SettingsKeyboard')}</h4>

          <RadioGroup name="keyboard-send-settings" options={keyboardSendOptions} onChange={handleMessageSendComboChange} selected={messageSendKeyCombo}/>
        </div>)}
    </div>);
};
export default memo(withGlobal((global) => {
    const { theme, shouldUseSystemTheme, messageSendKeyCombo, messageTextSize, timeFormat, } = selectSharedSettings(global);
    return {
        messageSendKeyCombo,
        messageTextSize,
        timeFormat,
        theme,
        shouldUseSystemTheme,
    };
})(SettingsGeneral));
