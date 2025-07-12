import { Api as GramJs } from '../../../lib/gramjs';
import { checkErrorType, wrapError } from '../helpers/misc';
import { sendApiUpdate } from '../updates/apiUpdateEmitter';
import { getCurrentPassword, getTmpPassword, invokeRequest, updateTwoFaSettings, } from './client';
const emailCodeController = {};
export async function getPasswordInfo() {
    const result = await invokeRequest(new GramJs.account.GetPassword());
    if (!result) {
        return undefined;
    }
    const { hint, hasPassword } = result;
    return { hint, hasPassword };
}
function onRequestEmailCode(length) {
    sendApiUpdate({
        '@type': 'updateTwoFaStateWaitCode',
        length,
    });
    return new Promise((resolve, reject) => {
        emailCodeController.resolve = resolve;
        emailCodeController.reject = reject;
    });
}
export function getTemporaryPaymentPassword(password, ttl) {
    try {
        return getTmpPassword(password, ttl);
    }
    catch (err) {
        if (!checkErrorType(err))
            return undefined;
        return Promise.resolve(wrapError(err));
    }
}
export function getPassword(password) {
    try {
        return getCurrentPassword(password);
    }
    catch (err) {
        if (!checkErrorType(err))
            return undefined;
        return Promise.resolve(wrapError(err));
    }
}
export async function checkPassword(currentPassword) {
    try {
        await updateTwoFaSettings({ isCheckPassword: true, currentPassword });
        return true;
    }
    catch (err) {
        onError(err);
        return false;
    }
}
export async function clearPassword(currentPassword) {
    try {
        await updateTwoFaSettings({ currentPassword });
        return true;
    }
    catch (err) {
        onError(err);
        return false;
    }
}
export async function updatePassword(currentPassword, password, hint, email) {
    try {
        await updateTwoFaSettings({
            currentPassword,
            newPassword: password,
            hint,
            email,
            emailCodeCallback: onRequestEmailCode,
            onEmailCodeError: onError,
        });
        return true;
    }
    catch (err) {
        onError(err);
        return false;
    }
}
export async function updateRecoveryEmail(currentPassword, email) {
    try {
        await updateTwoFaSettings({
            currentPassword,
            newPassword: currentPassword,
            email,
            emailCodeCallback: onRequestEmailCode,
            onEmailCodeError: onError,
        });
        return true;
    }
    catch (err) {
        onError(err);
        return false;
    }
}
export function provideRecoveryEmailCode(code) {
    emailCodeController.resolve(code);
}
function onError(err) {
    const wrappedError = wrapError(err);
    sendApiUpdate({
        '@type': 'updateTwoFaError',
        messageKey: wrappedError.messageKey,
    });
}
