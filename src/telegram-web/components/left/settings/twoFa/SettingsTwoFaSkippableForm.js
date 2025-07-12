import { memo, useCallback, useEffect, useRef, useState, } from '../../../../lib/teact/teact';
import { withGlobal } from '../../../../global';
import { selectAnimatedEmoji } from '../../../../global/selectors';
import { IS_TOUCH_ENV } from '../../../../util/browser/windowEnvironment';
import renderText from '../../../common/helpers/renderText';
import useAppLayout from '../../../../hooks/useAppLayout';
import useFlag from '../../../../hooks/useFlag';
import useHistoryBack from '../../../../hooks/useHistoryBack';
import useOldLang from '../../../../hooks/useOldLang';
import AnimatedIconFromSticker from '../../../common/AnimatedIconFromSticker';
import Button from '../../../ui/Button';
import InputText from '../../../ui/InputText';
import Modal from '../../../ui/Modal';
const ICON_SIZE = 160;
const SettingsTwoFaSkippableForm = ({ animatedEmoji, type = 'text', isLoading, error, placeholder, shouldConfirm, clearError, onSubmit, isActive, onReset, }) => {
    const inputRef = useRef();
    const { isMobile } = useAppLayout();
    const focusDelayTimeoutMs = isMobile ? 550 : 400;
    const [value, setValue] = useState('');
    const [isConfirmShown, markIsConfirmShown, unmarkIsConfirmShown] = useFlag(false);
    useEffect(() => {
        if (!IS_TOUCH_ENV) {
            setTimeout(() => {
                inputRef.current.focus();
            }, focusDelayTimeoutMs);
        }
    }, [focusDelayTimeoutMs]);
    const handleInputChange = useCallback((e) => {
        if (error && clearError) {
            clearError();
        }
        setValue(e.target.value);
    }, [clearError, error]);
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputRef.current) {
            return;
        }
        onSubmit(value);
    };
    const handleSkip = useCallback(() => {
        onSubmit();
    }, [onSubmit]);
    const handleSkipConfirm = useCallback(() => {
        unmarkIsConfirmShown();
        onSubmit();
    }, [onSubmit, unmarkIsConfirmShown]);
    const lang = useOldLang();
    useHistoryBack({
        isActive,
        onBack: onReset,
    });
    return (<div className="settings-content two-fa custom-scroll">
      <div className="settings-content-header no-border">
        <AnimatedIconFromSticker sticker={animatedEmoji} size={ICON_SIZE} className="settings-content-icon"/>
        {type === 'email' && (<p className="settings-item-description mb-3" dir="auto">
            {lang('RecoveryEmailSubtitle')}
          </p>)}
      </div>

      <div className="settings-item settings-group">
        <form action="" onSubmit={handleSubmit}>
          <InputText ref={inputRef} value={value} inputMode={type} label={placeholder} error={error} onChange={handleInputChange}/>

          {value ? (<Button type="submit" isLoading={isLoading} ripple>{lang('Continue')}</Button>) : (<Button isText isLoading={isLoading} ripple onClick={shouldConfirm ? markIsConfirmShown : handleSkip}>
              {lang('YourEmailSkip')}
            </Button>)}
        </form>
        {shouldConfirm && (<Modal className="narrow" isOpen={isConfirmShown} title={lang('YourEmailSkipWarning')} onClose={unmarkIsConfirmShown}>
            {renderText(lang('YourEmailSkipWarningText'), ['br', 'simple_markdown'])}
            <div className="dialog-buttons">
              <Button color="danger" ripple isText className="confirm-dialog-button" onClick={handleSkipConfirm}>
                {lang('YourEmailSkip')}
              </Button>
              <Button color="primary" ripple isText className="confirm-dialog-button" onClick={unmarkIsConfirmShown}>
                {lang('Cancel')}
              </Button>
            </div>
          </Modal>)}
      </div>
    </div>);
};
export default memo(withGlobal((global, { icon }) => {
    return {
        animatedEmoji: selectAnimatedEmoji(global, icon === 'email' ? '💌' : '💡'),
    };
})(SettingsTwoFaSkippableForm));
