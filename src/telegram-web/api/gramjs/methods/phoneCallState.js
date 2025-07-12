import BigInt from 'big-integer';
import { AuthKey } from '../../../lib/gramjs/crypto/AuthKey';
import { Logger } from '../../../lib/gramjs/extensions';
import { convertToLittle, getByteArray, modExp, readBigIntFromBuffer, sha1, sha256, } from '../../../lib/gramjs/Helpers';
import MTProtoState from '../../../lib/gramjs/network/MTProtoState';
let currentPhoneCallState;
class PhoneCallState {
    isOutgoing;
    state;
    seq = 0;
    gA;
    gB;
    p;
    random;
    waitForState;
    resolveState;
    constructor(isOutgoing) {
        this.isOutgoing = isOutgoing;
        this.waitForState = new Promise((resolve) => {
            this.resolveState = resolve;
        });
    }
    async requestCall({ p, g, random }) {
        const pBN = readBigIntFromBuffer(Buffer.from(p), false);
        const randomBN = readBigIntFromBuffer(Buffer.from(random), false);
        const gA = modExp(BigInt(g), randomBN, pBN);
        this.gA = gA;
        this.p = pBN;
        this.random = randomBN;
        const gAHash = await sha256(getByteArray(gA));
        return Array.from(gAHash);
    }
    acceptCall({ p, g, random }) {
        const pLast = readBigIntFromBuffer(p, false);
        const randomLast = readBigIntFromBuffer(random, false);
        const gB = modExp(BigInt(g), randomLast, pLast);
        this.gB = gB;
        this.p = pLast;
        this.random = randomLast;
        return Array.from(getByteArray(gB));
    }
    async confirmCall(gAOrB, emojiData, emojiOffsets) {
        if (!this.random || !this.p) {
            throw new Error('Values not set');
        }
        if (this.isOutgoing) {
            this.gB = readBigIntFromBuffer(Buffer.from(gAOrB), false);
        }
        else {
            this.gA = readBigIntFromBuffer(Buffer.from(gAOrB), false);
        }
        const authKey = modExp(!this.isOutgoing ? this.gA : this.gB, this.random, this.p);
        const fingerprint = await sha1(getByteArray(authKey));
        const keyFingerprint = readBigIntFromBuffer(fingerprint.slice(-8).reverse(), false);
        const emojis = await generateEmojiFingerprint(getByteArray(authKey), getByteArray(this.gA), emojiData, emojiOffsets);
        const key = new AuthKey();
        await key.setKey(getByteArray(authKey));
        this.state = new MTProtoState(key, new Logger(), true, this.isOutgoing);
        this.resolveState();
        return { gA: Array.from(getByteArray(this.gA)), keyFingerprint: keyFingerprint.toString(), emojis };
    }
    async encode(data) {
        if (!this.state)
            return undefined;
        const seqArray = new Uint32Array(1);
        seqArray[0] = this.seq++;
        const encodedData = await this.state.encryptMessageData(Buffer.concat([convertToLittle(seqArray), Buffer.from(data)]));
        return Array.from(encodedData);
    }
    async decode(data) {
        if (!this.state) {
            return this.waitForState.then(() => {
                return this.decode(data);
            });
        }
        const message = await this.state.decryptMessageData(Buffer.from(data));
        return JSON.parse(message.toString());
    }
}
// https://github.com/TelegramV/App/blob/ead52320975362139cabad18cf8346f98c349a22/src/js/MTProto/Calls/Internal.js#L72
function computeEmojiIndex(bytes) {
    return ((BigInt(bytes[0]).and(0x7F)).shiftLeft(56))
        .or((BigInt(bytes[1]).shiftLeft(48)))
        .or((BigInt(bytes[2]).shiftLeft(40)))
        .or((BigInt(bytes[3]).shiftLeft(32)))
        .or((BigInt(bytes[4]).shiftLeft(24)))
        .or((BigInt(bytes[5]).shiftLeft(16)))
        .or((BigInt(bytes[6]).shiftLeft(8)))
        .or((BigInt(bytes[7])));
}
async function generateEmojiFingerprint(authKey, gA, emojiData, emojiOffsets) {
    const hash = await sha256(Buffer.concat([new Uint8Array(authKey), new Uint8Array(gA)]));
    const result = [];
    const emojiCount = emojiOffsets.length - 1;
    const kPartSize = 8;
    for (let partOffset = 0; partOffset !== hash.byteLength; partOffset += kPartSize) {
        const value = computeEmojiIndex(hash.subarray(partOffset, partOffset + kPartSize));
        const index = value.modPow(1, emojiCount).toJSNumber();
        const offset = emojiOffsets[index];
        const size = emojiOffsets[index + 1] - offset;
        result.push(String.fromCharCode(...emojiData.subarray(offset, offset + size)));
    }
    return result.join('');
}
export function createPhoneCallState(params) {
    currentPhoneCallState = new PhoneCallState(...params);
}
export function destroyPhoneCallState() {
    currentPhoneCallState = undefined;
}
export function encodePhoneCallData(params) {
    return currentPhoneCallState.encode(...params);
}
export async function decodePhoneCallData(params) {
    if (!currentPhoneCallState) {
        return undefined;
    }
    const result = await currentPhoneCallState.decode(...params);
    return result;
}
export function confirmPhoneCall(params) {
    return currentPhoneCallState.confirmCall(...params);
}
export function acceptPhoneCall(params) {
    return currentPhoneCallState.acceptCall(...params);
}
export function requestPhoneCall(params) {
    return currentPhoneCallState.requestCall(...params);
}
