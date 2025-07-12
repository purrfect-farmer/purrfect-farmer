import { memo, useEffect, useRef, useState, } from '../../lib/teact/teact';
import { MIN_PASSWORD_LENGTH } from '../../config';
import { requestMutation } from '../../lib/fasterdom/fasterdom';
import { IS_TOUCH_ENV } from '../../util/browser/windowEnvironment';
import buildClassName from '../../util/buildClassName';
import stopEvent from '../../util/stopEvent';
import useTimeout from '../../hooks/schedulers/useTimeout';
import useAppLayout from '../../hooks/useAppLayout';
import useOldLang from '../../hooks/useOldLang';
import Button from '../ui/Button';
import Icon from './icons/Icon';
const PasswordForm = ({ isLoading = false, isPasswordVisible, error, hint, placeholder = 'Password', submitLabel = 'Next', description, shouldShowSubmit, shouldResetValue, shouldDisablePasswordManager = false, noRipple = false, clearError, onChangePasswordVisibility, onInputChange, onSubmit, }) => {
    const inputRef = useRef();
    const lang = useOldLang();
    const { isMobile } = useAppLayout();
    const [password, setPassword] = useState('');
    const [canSubmit, setCanSubmit] = useState(false);
    const focusDelayTimeoutMs = isMobile ? 550 : 400;
    useEffect(() => {
        if (shouldResetValue) {
            setPassword('');
        }
    }, [shouldResetValue]);
    useTimeout(() => {
        if (!IS_TOUCH_ENV) {
            inputRef.current.focus();
        }
    }, focusDelayTimeoutMs);
    useEffect(() => {
        if (error) {
            requestMutation(() => {
                inputRef.current.focus();
                inputRef.current.select();
            });
        }
    }, [error]);
    function onPasswordChange(e) {
        if (error) {
            clearError();
        }
        const { target } = e;
        setPassword(target.value);
        setCanSubmit(target.value.length >= MIN_PASSWORD_LENGTH);
        if (onInputChange) {
            onInputChange(target.value);
        }
    }
    function togglePasswordVisibility() {
        onChangePasswordVisibility(!isPasswordVisible);
    }
    function handleSubmit(event) {
        event.preventDefault();
        if (isLoading) {
            return;
        }
        if (canSubmit) {
            onSubmit(password);
        }
    }
    function renderFakeInput() {
        return (<input type="password" id="prevent_autofill" autoComplete="off" className="visually-hidden" tabIndex={-2}/>);
    }
    return (<form action="" onSubmit={onSubmit ? handleSubmit : stopEvent} autoComplete="off">
      <div className={buildClassName('input-group password-input', password && 'touched', error && 'error')} dir={lang.isRtl ? 'rtl' : undefined}>
        {shouldDisablePasswordManager && renderFakeInput()}
        <input ref={inputRef} className="form-control" type={isPasswordVisible ? 'text' : 'password'} id="sign-in-password" value={password || ''} autoComplete={shouldDisablePasswordManager ? 'one-time-code' : 'current-password'} onChange={onPasswordChange} maxLength={256} dir="auto"/>
        <label>{error || hint || placeholder}</label>
        <div className="div-button toggle-password" onClick={togglePasswordVisibility} role="button" tabIndex={0} title="Toggle password visibility" aria-label="Toggle password visibility">
          <Icon name={isPasswordVisible ? 'eye' : 'eye-crossed'}/>
        </div>
      </div>
      {description && <p className="description">{description}</p>}
      {onSubmit && (canSubmit || shouldShowSubmit) && (<Button size="smaller" type="submit" ripple={!noRipple} isLoading={isLoading} disabled={!canSubmit}>
          {submitLabel}
        </Button>)}
    </form>);
};
export default memo(PasswordForm);
