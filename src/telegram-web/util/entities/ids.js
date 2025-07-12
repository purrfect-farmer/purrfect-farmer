import { CHANNEL_ID_BASE } from '../../config';
export function isUserId(entityId) {
    return !entityId.startsWith('-');
}
export function isChannelId(entityId) {
    const n = Number(entityId);
    return n < -CHANNEL_ID_BASE;
}
export function toChannelId(mtpId) {
    const n = Number(mtpId);
    return String(-CHANNEL_ID_BASE - n);
}
export function getCleanPeerId(peerId) {
    return isChannelId(peerId)
        // Remove -1 and leading zeros
        ? peerId.replace(/^-10+/, '')
        : peerId.replace('-', '');
}
export function getPeerIdDividend(peerId) {
    return Math.abs(Number(getCleanPeerId(peerId)));
}
