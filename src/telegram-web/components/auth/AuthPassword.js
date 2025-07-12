import { memo, useCallback, useState } from '../../lib/teact/teact';
import { getActions, withGlobal } from '../../global';
import { pick } from '../../util/iteratees';
import useLang from '../../hooks/useLang';
import PasswordForm from '../common/PasswordForm';
import MonkeyPassword from '../common/PasswordMonkey';
const AuthPassword = ({ authIsLoading, authErrorKey, authHint, }) => {
    const { setAuthPassword, clearAuthErrorKey } = getActions();
    const lang = useLang();
    const [showPassword, setShowPassword] = useState(false);
    const handleChangePasswordVisibility = useCallback((isVisible) => {
        setShowPassword(isVisible);
    }, []);
    const handleSubmit = useCallback((password) => {
        setAuthPassword({ password });
    }, [setAuthPassword]);
    return (<div id="auth-password-form" className="custom-scroll">
      <div className="auth-form">
        <MonkeyPassword isPasswordVisible={showPassword}/>
        <h1>{lang('LoginHeaderPassword')}</h1>
        <p className="note">{lang('LoginEnterPasswordDescription')}</p>
        <PasswordForm clearError={clearAuthErrorKey} error={authErrorKey && lang.withRegular(authErrorKey)} hint={authHint} isLoading={authIsLoading} isPasswordVisible={showPassword} onChangePasswordVisibility={handleChangePasswordVisibility} onSubmit={handleSubmit}/>
      </div>
    </div>);
};
export default memo(withGlobal((global) => pick(global, ['authIsLoading', 'authErrorKey', 'authHint']))(AuthPassword));
