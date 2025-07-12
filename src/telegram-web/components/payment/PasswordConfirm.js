import { memo, useMemo, useState } from '../../lib/teact/teact';
import { getActions, withGlobal } from '../../global';
import { selectTabState } from '../../global/selectors';
import useLang from '../../hooks/useLang';
import useOldLang from '../../hooks/useOldLang';
import PasswordForm from '../common/PasswordForm';
import PasswordMonkey from '../common/PasswordMonkey';
const PasswordConfirm = ({ isActive, errorKey, state, savedCredentials, passwordHint, onPasswordChange, }) => {
    const { clearPaymentError } = getActions();
    const oldLang = useOldLang();
    const lang = useLang();
    const [shouldShowPassword, setShouldShowPassword] = useState(false);
    const cardName = useMemo(() => {
        return savedCredentials?.length && state.savedCredentialId
            ? savedCredentials.find(({ id }) => id === state.savedCredentialId)?.title
            : undefined;
    }, [savedCredentials, state.savedCredentialId]);
    return (<div className="PaymentInfo">
      <PasswordMonkey isBig isPasswordVisible={shouldShowPassword}/>

      <PasswordForm error={errorKey && lang.withRegular(errorKey)} hint={passwordHint} description={oldLang('PaymentConfirmationMessage', cardName)} placeholder={oldLang('Password')} clearError={clearPaymentError} shouldShowSubmit={false} shouldResetValue={isActive} isPasswordVisible={shouldShowPassword} onChangePasswordVisibility={setShouldShowPassword} onInputChange={onPasswordChange}/>
    </div>);
};
export default memo(withGlobal((global) => {
    const { payment } = selectTabState(global);
    return {
        errorKey: payment.error?.messageKey,
        passwordHint: global.twoFaSettings.hint,
        savedCredentials: payment.form?.type === 'regular' ? payment.form.savedCredentials : undefined,
    };
})(PasswordConfirm));
