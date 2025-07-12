const VISA = /^4\d/;
const MASTERCARD1 = /^5[1-5]/;
const MASTERCARD2 = /^2[2-7]\d{2}/;
const MIR = /^220[0-4]/;
export var CardType;
(function (CardType) {
    CardType[CardType["Default"] = 0] = "Default";
    CardType[CardType["Visa"] = 1] = "Visa";
    CardType[CardType["Mastercard"] = 2] = "Mastercard";
    CardType[CardType["Mir"] = 3] = "Mir";
})(CardType || (CardType = {}));
const cards = {
    [CardType.Default]: '',
    [CardType.Visa]: 'visa',
    [CardType.Mastercard]: 'mastercard',
    [CardType.Mir]: 'mir',
};
export function detectCardType(cardNumber) {
    cardNumber = cardNumber.replace(/\s/g, '');
    if (VISA.test(cardNumber)) {
        return CardType.Visa;
    }
    if (MIR.test(cardNumber)) {
        return CardType.Mir;
    }
    if (MASTERCARD1.test(cardNumber) || MASTERCARD2.test(cardNumber)) {
        return CardType.Mastercard;
    }
    return CardType.Default;
}
export function detectCardTypeText(cardNumber) {
    const cardType = detectCardType(cardNumber);
    return cards[cardType] || '';
}
