import { IGE as AesIge } from '@cryptography/aes';
import { convertToLittle, generateRandomBytes } from '../Helpers';
class IGENEW {
    ige;
    constructor(key, iv) {
        this.ige = new AesIge(key, iv);
    }
    /**
       * Decrypts the given text in 16-bytes blocks by using the given key and 32-bytes initialization vector
       * @param cipherText {Buffer}
       * @returns {Buffer}
       */
    decryptIge(cipherText) {
        return convertToLittle(this.ige.decrypt(cipherText));
    }
    /**
       * Encrypts the given text in 16-bytes blocks by using the given key and 32-bytes initialization vector
       * @param plainText {Buffer}
       * @returns {Buffer}
       */
    encryptIge(plainText) {
        const padding = plainText.length % 16;
        if (padding) {
            plainText = Buffer.concat([
                plainText,
                generateRandomBytes(16 - padding),
            ]);
        }
        return convertToLittle(this.ige.encrypt(plainText));
    }
}
export { IGENEW as IGE };
