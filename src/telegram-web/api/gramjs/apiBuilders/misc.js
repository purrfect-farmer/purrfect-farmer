import { Api as GramJs } from '../../../lib/gramjs';
import { numberToHexColor } from '../../../util/colors';
import { buildCollectionByCallback, omit, omitUndefined, pick, } from '../../../util/iteratees';
import { addUserToLocalDb } from '../helpers/localDb';
import { omitVirtualClassFields } from './helpers';
import { buildApiDocument, buildMessageTextContent } from './messageContent';
import { buildApiPeerId, getApiChatIdFromMtpPeer } from './peers';
import { buildApiReaction } from './reactions';
import { buildApiUser } from './users';
export function buildApiWallpaper(wallpaper) {
    if (wallpaper instanceof GramJs.WallPaperNoFile) {
        // TODO: Plain color wallpapers
        return undefined;
    }
    const { slug } = wallpaper;
    const document = buildApiDocument(wallpaper.document);
    if (!document) {
        return undefined;
    }
    return {
        slug,
        document,
    };
}
export function buildApiSession(session) {
    return {
        isCurrent: Boolean(session.current),
        isOfficialApp: Boolean(session.officialApp),
        isPasswordPending: Boolean(session.passwordPending),
        hash: String(session.hash),
        areCallsEnabled: !session.callRequestsDisabled,
        areSecretChatsEnabled: !session.encryptedRequestsDisabled,
        isUnconfirmed: session.unconfirmed,
        ...pick(session, [
            'deviceModel', 'platform', 'systemVersion', 'appName', 'appVersion', 'dateCreated', 'dateActive',
            'ip', 'country', 'region',
        ]),
    };
}
export function buildApiWebSession(session) {
    return {
        hash: String(session.hash),
        botId: buildApiPeerId(session.botId, 'user'),
        ...pick(session, [
            'platform', 'browser', 'dateCreated', 'dateActive', 'ip', 'region', 'domain',
        ]),
    };
}
export function buildPrivacyKey(key) {
    switch (key.className) {
        case 'PrivacyKeyPhoneNumber':
            return 'phoneNumber';
        case 'PrivacyKeyAddedByPhone':
            return 'addByPhone';
        case 'PrivacyKeyStatusTimestamp':
            return 'lastSeen';
        case 'PrivacyKeyProfilePhoto':
            return 'profilePhoto';
        case 'PrivacyKeyPhoneCall':
            return 'phoneCall';
        case 'PrivacyKeyPhoneP2P':
            return 'phoneP2P';
        case 'PrivacyKeyForwards':
            return 'forwards';
        case 'PrivacyKeyVoiceMessages':
            return 'voiceMessages';
        case 'PrivacyKeyChatInvite':
            return 'chatInvite';
        case 'PrivacyKeyAbout':
            return 'bio';
        case 'PrivacyKeyBirthday':
            return 'birthday';
        case 'PrivacyKeyStarGiftsAutoSave':
            return 'gifts';
        case 'PrivacyKeyNoPaidMessages':
            return 'noPaidMessages';
    }
    return undefined;
}
export function buildApiPeerNotifySettings(notifySettings) {
    const { silent, muteUntil, showPreviews, otherSound, } = notifySettings;
    const hasSound = !(otherSound instanceof GramJs.NotificationSoundNone);
    return {
        hasSound,
        isSilentPosting: silent,
        mutedUntil: muteUntil,
        shouldShowPreviews: showPreviews,
    };
}
function buildApiCountry(country, code) {
    const { hidden, iso2, defaultName, name, } = country;
    const { countryCode, prefixes, patterns } = code || {};
    return {
        isHidden: hidden,
        iso2,
        defaultName,
        name,
        countryCode,
        prefixes,
        patterns,
    };
}
export function buildApiCountryList(countries) {
    const nonHiddenCountries = countries.filter(({ hidden }) => !hidden);
    const listByCode = nonHiddenCountries
        .map((country) => (country.countryCodes.map((code) => buildApiCountry(country, code))))
        .flat()
        .sort((a, b) => (a.name ? a.name.localeCompare(b.name) : a.defaultName.localeCompare(b.defaultName)));
    const generalList = nonHiddenCountries
        .map((country) => buildApiCountry(country, country.countryCodes[0]))
        .sort((a, b) => (a.name ? a.name.localeCompare(b.name) : a.defaultName.localeCompare(b.defaultName)));
    return {
        phoneCodes: listByCode,
        general: generalList,
    };
}
export function buildJson(json) {
    if (json instanceof GramJs.JsonNull)
        return undefined;
    if (json instanceof GramJs.JsonString
        || json instanceof GramJs.JsonBool
        || json instanceof GramJs.JsonNumber)
        return json.value;
    if (json instanceof GramJs.JsonArray)
        return json.value.map(buildJson);
    return json.value.reduce((acc, el) => {
        acc[el.key] = buildJson(el.value);
        return acc;
    }, {});
}
export function buildApiUrlAuthResult(result) {
    if (result instanceof GramJs.UrlAuthResultRequest) {
        const { bot, domain, requestWriteAccess } = result;
        const user = buildApiUser(bot);
        if (!user)
            return undefined;
        addUserToLocalDb(bot);
        return {
            type: 'request',
            domain,
            shouldRequestWriteAccess: requestWriteAccess,
            bot: user,
        };
    }
    if (result instanceof GramJs.UrlAuthResultAccepted) {
        return {
            type: 'accepted',
            url: result.url,
        };
    }
    if (result instanceof GramJs.UrlAuthResultDefault) {
        return {
            type: 'default',
        };
    }
    return undefined;
}
export function buildApiConfig(config) {
    const { testMode, expires, gifSearchUsername, chatSizeMax, autologinToken, reactionsDefault, messageLengthMax, editTimeLimit, forwardedCountMax, } = config;
    const defaultReaction = reactionsDefault && buildApiReaction(reactionsDefault);
    return {
        isTestServer: testMode,
        expiresAt: expires,
        gifSearchUsername,
        defaultReaction,
        maxGroupSize: chatSizeMax,
        autologinToken,
        maxMessageLength: messageLengthMax,
        editTimeLimit,
        maxForwardedCount: forwardedCountMax,
    };
}
export function oldBuildLangPack(mtpLangPack) {
    return mtpLangPack.strings.reduce((acc, mtpString) => {
        acc[mtpString.key] = oldBuildLangPackString(mtpString);
        return acc;
    }, {});
}
export function oldBuildLangPackString(mtpString) {
    return mtpString instanceof GramJs.LangPackString
        ? mtpString.value
        : mtpString instanceof GramJs.LangPackStringPluralized
            ? omit(omitVirtualClassFields(mtpString), ['key'])
            : undefined;
}
export function buildLangStrings(strings) {
    const keysToRemove = [];
    const apiStrings = strings.reduce((acc, mtpString) => {
        if (mtpString instanceof GramJs.LangPackStringDeleted) {
            keysToRemove.push(mtpString.key);
        }
        if (mtpString instanceof GramJs.LangPackString) {
            acc[mtpString.key] = mtpString.value;
        }
        if (mtpString instanceof GramJs.LangPackStringPluralized) {
            acc[mtpString.key] = omitUndefined({
                zero: mtpString.zeroValue,
                one: mtpString.oneValue,
                two: mtpString.twoValue,
                few: mtpString.fewValue,
                many: mtpString.manyValue,
                other: mtpString.otherValue,
            });
        }
        return acc;
    }, {});
    return {
        keysToRemove,
        strings: apiStrings,
    };
}
export function buildApiLanguage(lang) {
    const { name, nativeName, langCode, pluralCode, rtl, stringsCount, translatedCount, translationsUrl, beta, official, } = lang;
    return {
        name,
        nativeName,
        langCode,
        pluralCode,
        isRtl: rtl,
        isBeta: beta,
        isOfficial: official,
        stringsCount,
        translatedCount,
        translationsUrl,
    };
}
function buildApiPeerColorSet(colorSet) {
    if (colorSet instanceof GramJs.help.PeerColorSet) {
        return colorSet.colors.map((color) => numberToHexColor(color));
    }
    return undefined;
}
export function buildApiPeerColors(wrapper) {
    if (!(wrapper instanceof GramJs.help.PeerColors))
        return undefined;
    return buildCollectionByCallback(wrapper.colors, (color) => {
        return [color.colorId, {
                isHidden: color.hidden,
                colors: color.colors && buildApiPeerColorSet(color.colors),
                darkColors: color.darkColors && buildApiPeerColorSet(color.darkColors),
            }];
    });
}
export function buildApiTimezone(timezone) {
    const { id, name, utcOffset } = timezone;
    return {
        id,
        name,
        utcOffset,
    };
}
export function buildApiChatLink(data) {
    const chatId = getApiChatIdFromMtpPeer(data.peer);
    return {
        chatId,
        text: buildMessageTextContent(data.message, data.entities),
    };
}
export function buildApiCollectibleInfo(info) {
    const { amount, currency, cryptoAmount, cryptoCurrency, purchaseDate, url, } = info;
    return {
        amount: amount.toJSNumber(),
        currency,
        cryptoAmount: cryptoAmount.toJSNumber(),
        cryptoCurrency,
        purchaseDate,
        url,
    };
}
