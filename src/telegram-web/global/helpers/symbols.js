import { ApiMessageEntityTypes } from '../../api/types';
export function getStickerHashById(stickerId, isPreview) {
    const base = `sticker${stickerId}`;
    return !isPreview ? base : `${base}?size=m`;
}
export function containsCustomEmoji(formattedText) {
    return formattedText.entities?.some((e) => e.type === ApiMessageEntityTypes.CustomEmoji);
}
export function stripCustomEmoji(text) {
    if (!text.entities)
        return text;
    const entities = text.entities.filter((entity) => entity.type !== ApiMessageEntityTypes.CustomEmoji);
    return { ...text, entities };
}
