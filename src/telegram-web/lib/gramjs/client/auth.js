import bigInt from 'big-integer';
import { getServerTime } from '../../../util/serverTime';
import { DEFAULT_PRIMITIVES } from '../../../api/gramjs/gramjsBuilders';
import { RPCError } from '../errors';
import Api from '../tl/api';
import { sleep } from '../Helpers';
import { computeCheck as computePasswordSrpCheck } from '../Password';
import { getDisplayName } from '../Utils';
const DEFAULT_INITIAL_METHOD = 'phoneNumber';
export async function authFlow(client, apiCredentials, authParams) {
    let me;
    if ('botAuthToken' in authParams) {
        me = await signInBot(client, apiCredentials, authParams);
    }
    else if ('webAuthToken' in authParams && authParams.webAuthToken) {
        me = await signInUserWithWebToken(client, apiCredentials, authParams);
    }
    else {
        me = await signInUserWithPreferredMethod(client, apiCredentials, authParams);
    }
    client._log.info(`Signed in successfully as ${getDisplayName(me)}`);
}
export function signInUserWithPreferredMethod(client, apiCredentials, authParams) {
    const { initialMethod = DEFAULT_INITIAL_METHOD } = authParams;
    if (initialMethod === 'phoneNumber') {
        return signInUser(client, apiCredentials, authParams);
    }
    else {
        return signInUserWithQrCode(client, apiCredentials, authParams);
    }
}
export async function checkAuthorization(client, shouldThrow = false) {
    try {
        await client.invoke(new Api.updates.GetState());
        return true;
    }
    catch (err) {
        if ((err instanceof Error && err.message === 'Disconnect') || shouldThrow)
            throw err;
        return false;
    }
}
async function signInUserWithWebToken(client, apiCredentials, authParams) {
    try {
        const { apiId, apiHash } = apiCredentials;
        const sendResult = await client.invoke(new Api.auth.ImportWebTokenAuthorization({
            webAuthToken: authParams.webAuthToken,
            apiId,
            apiHash,
        }));
        if (sendResult instanceof Api.auth.Authorization) {
            return sendResult.user;
        }
        else {
            throw new Error('SIGN_UP_REQUIRED');
        }
    }
    catch (err) {
        if (err instanceof RPCError && err.errorMessage === 'SESSION_PASSWORD_NEEDED') {
            return signInWithPassword(client, apiCredentials, authParams, true);
        }
        else {
            client._log.error(`Failed to login with web token: ${String(err)}`);
            authParams.webAuthTokenFailed();
            return signInUserWithPreferredMethod(client, apiCredentials, {
                ...authParams,
                webAuthToken: undefined,
            });
        }
    }
}
async function signInUser(client, apiCredentials, authParams) {
    let phoneNumber;
    let phoneCodeHash;
    let isCodeViaApp = false;
    while (true) {
        try {
            if (typeof authParams.phoneNumber === 'function') {
                try {
                    phoneNumber = await authParams.phoneNumber();
                }
                catch (err) {
                    if (err instanceof Error && err.message === 'RESTART_AUTH_WITH_QR') {
                        return signInUserWithQrCode(client, apiCredentials, authParams);
                    }
                    throw err;
                }
            }
            else {
                phoneNumber = authParams.phoneNumber;
            }
            const sendCodeResult = await sendCode(client, apiCredentials, phoneNumber, authParams.forceSMS);
            phoneCodeHash = sendCodeResult.phoneCodeHash;
            isCodeViaApp = sendCodeResult.isCodeViaApp;
            if (typeof phoneCodeHash !== 'string') {
                throw new Error('Failed to retrieve phone code hash');
            }
            break;
        }
        catch (err) {
            if (typeof authParams.phoneNumber !== 'function') {
                throw err;
            }
            authParams.onError(err);
        }
    }
    let phoneCode;
    let isRegistrationRequired = false;
    let termsOfService;
    // eslint-disable-next-line no-constant-condition
    while (1) {
        try {
            try {
                phoneCode = await authParams.phoneCode(isCodeViaApp);
            }
            catch (err) {
                // This is the support for changing phone number from the phone code screen.
                if (err instanceof Error && err.message === 'RESTART_AUTH') {
                    return signInUser(client, apiCredentials, authParams);
                }
            }
            if (!phoneCode) {
                throw new Error('Code is empty');
            }
            // May raise PhoneCodeEmptyError, PhoneCodeExpiredError,
            // PhoneCodeHashEmptyError or PhoneCodeInvalidError.
            const result = await client.invoke(new Api.auth.SignIn({
                phoneNumber,
                phoneCodeHash,
                phoneCode,
            }));
            if (result instanceof Api.auth.AuthorizationSignUpRequired) {
                isRegistrationRequired = true;
                termsOfService = result.termsOfService;
                break;
            }
            return result.user;
        }
        catch (err) {
            if (err instanceof RPCError && err.errorMessage === 'SESSION_PASSWORD_NEEDED') {
                return signInWithPassword(client, apiCredentials, authParams);
            }
            else if (err instanceof Error) {
                authParams.onError(err);
            }
            else {
                // eslint-disable-next-line no-console
                console.warn('Unexpected error:', err);
            }
        }
    }
    if (isRegistrationRequired) {
        // eslint-disable-next-line no-constant-condition
        while (1) {
            try {
                const [firstName, lastName] = await authParams.firstAndLastNames();
                if (!firstName) {
                    throw new Error('First name is required');
                }
                const { user } = await client.invoke(new Api.auth.SignUp({
                    phoneNumber,
                    phoneCodeHash,
                    firstName,
                    lastName: lastName || DEFAULT_PRIMITIVES.STRING,
                }));
                if (termsOfService) {
                    // This is a violation of Telegram rules: the user should be presented with and accept TOS.
                    await client.invoke(new Api.help.AcceptTermsOfService({ id: termsOfService.id }));
                }
                return user;
            }
            catch (err) {
                authParams.onError(err);
            }
        }
    }
    authParams.onError(new Error('Auth failed'));
    return signInUser(client, apiCredentials, authParams);
}
async function signInUserWithQrCode(client, apiCredentials, authParams) {
    let isScanningComplete = false;
    const { apiId, apiHash } = apiCredentials;
    const inputPromise = (async () => {
        // eslint-disable-next-line no-constant-condition
        while (1) {
            if (isScanningComplete) {
                break;
            }
            const result = await client.invoke(new Api.auth.ExportLoginToken({
                apiId,
                apiHash,
                exceptIds: authParams.accountIds?.map((id) => bigInt(id)) || [],
            }));
            if (!(result instanceof Api.auth.LoginToken)) {
                throw new Error('Unexpected');
            }
            const { token, expires } = result;
            await Promise.race([
                authParams.qrCode({ token, expires }),
                sleep((expires - getServerTime()) * 1000),
            ]);
        }
    })();
    const updatePromise = new Promise((resolve) => {
        client.addEventHandler((update) => {
            if (update instanceof Api.UpdateLoginToken) {
                resolve();
            }
        }, { build: (update) => update });
    });
    try {
        // Either we receive an update that QR is successfully scanned,
        // or we receive a rejection caused by user going back to the regular auth form
        await Promise.race([updatePromise, inputPromise]);
    }
    catch (err) {
        if (err instanceof Error && err.message === 'RESTART_AUTH') {
            return await signInUser(client, apiCredentials, authParams);
        }
        throw err;
    }
    finally {
        isScanningComplete = true;
    }
    try {
        const result2 = await client.invoke(new Api.auth.ExportLoginToken({
            apiId,
            apiHash,
            exceptIds: authParams.accountIds?.map((id) => bigInt(id)) || [],
        }));
        if (result2 instanceof Api.auth.LoginTokenSuccess && result2.authorization instanceof Api.auth.Authorization) {
            return result2.authorization.user;
        }
        else if (result2 instanceof Api.auth.LoginTokenMigrateTo) {
            await client._switchDC(result2.dcId);
            const migratedResult = await client.invoke(new Api.auth.ImportLoginToken({
                token: result2.token,
            }));
            if (migratedResult instanceof Api.auth.LoginTokenSuccess
                && migratedResult.authorization instanceof Api.auth.Authorization) {
                return migratedResult.authorization.user;
            }
        }
    }
    catch (err) {
        if (err instanceof RPCError && err.errorMessage === 'SESSION_PASSWORD_NEEDED') {
            return signInWithPassword(client, apiCredentials, authParams);
        }
        throw err;
    }
    // This is a workaround for TypeScript (never actually reached)
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw undefined;
}
async function sendCode(client, apiCredentials, phoneNumber, forceSMS = false) {
    try {
        const { apiId, apiHash } = apiCredentials;
        const sendResult = await client.invoke(new Api.auth.SendCode({
            phoneNumber,
            apiId,
            apiHash,
            settings: new Api.CodeSettings(),
        }));
        if (!(sendResult instanceof Api.auth.SentCode)) {
            throw Error('Unexpected SentCodeSuccess');
        }
        // If we already sent a SMS, do not resend the phoneCode (hash may be empty)
        if (!forceSMS || (sendResult.type instanceof Api.auth.SentCodeTypeSms)) {
            return {
                phoneCodeHash: sendResult.phoneCodeHash,
                isCodeViaApp: sendResult.type instanceof Api.auth.SentCodeTypeApp,
            };
        }
        const resendResult = await client.invoke(new Api.auth.ResendCode({
            phoneNumber,
            phoneCodeHash: sendResult.phoneCodeHash,
        }));
        if (!(resendResult instanceof Api.auth.SentCode)) {
            throw Error('Unexpected SentCodeSuccess');
        }
        return {
            phoneCodeHash: resendResult.phoneCodeHash,
            isCodeViaApp: resendResult.type instanceof Api.auth.SentCodeTypeApp,
        };
    }
    catch (err) {
        if (err instanceof RPCError && err.errorMessage === 'AUTH_RESTART') {
            return sendCode(client, apiCredentials, phoneNumber, forceSMS);
        }
        else {
            throw err;
        }
    }
}
async function signInWithPassword(client, apiCredentials, authParams, noReset = false) {
    // eslint-disable-next-line no-constant-condition
    while (1) {
        try {
            const passwordSrpResult = await client.invoke(new Api.account.GetPassword());
            const password = await authParams.password(passwordSrpResult.hint, noReset);
            if (!password) {
                throw new Error('Password is empty');
            }
            const passwordSrpCheck = await computePasswordSrpCheck(passwordSrpResult, password);
            const { user } = await client.invoke(new Api.auth.CheckPassword({
                password: passwordSrpCheck,
            }));
            return user;
        }
        catch (err) {
            authParams.onError(err);
        }
    }
    return undefined; // Never reached (TypeScript fix)
}
async function signInBot(client, apiCredentials, authParams) {
    const { apiId, apiHash } = apiCredentials;
    const { botAuthToken } = authParams;
    const { user } = await client.invoke(new Api.auth.ImportBotAuthorization({
        apiId,
        apiHash,
        botAuthToken,
    }));
    return user;
}
