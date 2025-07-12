import { createCipheriv, createDecipheriv } from './crypto';
export class CTR {
    cipher;
    decipher;
    constructor(key, iv) {
        if (!Buffer.isBuffer(key) || !Buffer.isBuffer(iv) || iv.length !== 16) {
            throw new Error('Key and iv need to be a buffer');
        }
        this.cipher = createCipheriv('AES-256-CTR', key, iv);
        this.decipher = createDecipheriv('AES-256-CTR', key, iv);
    }
    encrypt(data) {
        return Buffer.from(this.cipher.update(data));
    }
    decrypt(data) {
        return Buffer.from(this.decipher.update(data));
    }
}
