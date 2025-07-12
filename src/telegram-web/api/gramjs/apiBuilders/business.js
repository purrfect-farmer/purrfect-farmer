import { buildGeoPoint } from './messageContent';
import { buildStickerFromDocument } from './symbols';
export function buildApiBusinessLocation(location) {
    const { address, geoPoint, } = location;
    return {
        address,
        geo: geoPoint && buildGeoPoint(geoPoint),
    };
}
export function buildApiBusinessWorkHours(workHours) {
    const { timezoneId, weeklyOpen, } = workHours;
    return {
        timezoneId,
        workHours: weeklyOpen.map(({ startMinute, endMinute }) => ({
            startMinute,
            endMinute,
        })),
    };
}
export function buildApiBusinessIntro(intro) {
    const { title, description, sticker, } = intro;
    return {
        title,
        description,
        sticker: sticker && buildStickerFromDocument(sticker),
    };
}
