import { STARS_CURRENCY_CODE } from '../config';
import { formatStarsAsIcon } from './localization/format';
export function formatCurrency(lang, totalPrice, currency, options) {
    const price = totalPrice / 10 ** getCurrencyExp(currency);
    if (currency === STARS_CURRENCY_CODE) {
        return formatStarsAsIcon(lang, price, { asFont: options?.asFontIcon, className: options?.iconClassName });
    }
    return formatCurrencyAsString(totalPrice, currency, lang.code, options);
}
export function formatCurrencyAsString(totalPrice, currency, locale = 'en', options) {
    const price = totalPrice / 10 ** getCurrencyExp(currency);
    if ((options?.shouldOmitFractions || currency === STARS_CURRENCY_CODE) && Number.isInteger(price)) {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    }
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
    }).format(price);
}
function getCurrencyExp(currency) {
    if (currency === 'TON') {
        return 9;
    }
    if (currency === 'CLF') {
        return 4;
    }
    if (['BHD', 'IQD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND'].includes(currency)) {
        return 3;
    }
    if ([
        'BIF', 'BYR', 'CLP', 'CVE', 'DJF', 'GNF', 'ISK', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'UYI',
        'VND', 'VUV', 'XAF', 'XOF', 'XPF', STARS_CURRENCY_CODE,
    ].includes(currency)) {
        return 0;
    }
    if (currency === 'MRO') {
        return 1;
    }
    return 2;
}
