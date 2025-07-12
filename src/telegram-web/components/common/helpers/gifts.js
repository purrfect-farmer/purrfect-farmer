export function getStickerFromGift(gift) {
    if (gift.type === 'starGift') {
        return gift.sticker;
    }
    return gift.attributes.find((attr) => attr.type === 'model')?.sticker;
}
export function getTotalGiftAvailability(gift) {
    if (gift.type === 'starGift') {
        return gift.availabilityTotal;
    }
    return gift.totalCount;
}
export function getGiftMessage(gift) {
    if (gift.type !== 'starGiftUnique')
        return undefined;
    return gift.attributes.find((attr) => attr.type === 'model')?.message;
}
export function getGiftAttributes(gift) {
    if (gift.type !== 'starGiftUnique')
        return undefined;
    return getGiftAttributesFromList(gift.attributes);
}
export function getGiftAttributesFromList(attributes) {
    const model = attributes.find((attr) => attr.type === 'model');
    const backdrop = attributes.find((attr) => attr.type === 'backdrop');
    const pattern = attributes.find((attr) => attr.type === 'pattern');
    const originalDetails = attributes.find((attr) => (attr.type === 'originalDetails'));
    return {
        model,
        originalDetails,
        pattern,
        backdrop,
    };
}
