import { AuthKey } from '../crypto/AuthKey';
import { getDC } from '../Utils';
import MemorySession from './Memory';
export default class CallbackSession extends MemorySession {
    _sessionData;
    _callback;
    _authKeys;
    constructor(sessionData, callback) {
        super();
        this._sessionData = sessionData;
        this._callback = callback;
        this._authKeys = {};
    }
    async load() {
        if (!this._sessionData) {
            return;
        }
        const { mainDcId, keys, isTest, } = this._sessionData;
        const { ipAddress, port, } = getDC(mainDcId);
        this.setDC(mainDcId, ipAddress, port, isTest, true);
        await Promise.all(Object.keys(keys)
            .map(async (dcIdStr) => {
            const dcId = Number(dcIdStr);
            const key = Buffer.from(keys[dcId], 'hex');
            this._authKeys[dcId] = new AuthKey();
            await this._authKeys[dcId].setKey(key);
        }));
    }
    setDC(dcId, serverAddress, port, isTestServer, skipOnUpdate = false) {
        this._dcId = dcId;
        this._serverAddress = serverAddress;
        this._port = port;
        this._isTestServer = isTestServer;
        delete this._authKeys[dcId];
        if (!skipOnUpdate) {
            void this._onUpdate();
        }
    }
    getAuthKey(dcId = this._dcId) {
        return this._authKeys[dcId];
    }
    setAuthKey(authKey, dcId = this._dcId) {
        this._authKeys[dcId] = authKey;
        void this._onUpdate();
    }
    getSessionData() {
        const sessionData = {
            mainDcId: this._dcId,
            keys: {},
            isTest: this._isTestServer || undefined,
        };
        Object
            .keys(this._authKeys)
            .forEach((dcIdStr) => {
            const dcId = Number(dcIdStr);
            const authKey = this._authKeys[dcId];
            if (!authKey?._key)
                return;
            sessionData.keys[dcId] = authKey._key.toString('hex');
        });
        return sessionData;
    }
    _onUpdate() {
        this._callback(this.getSessionData());
    }
    delete() {
        this._callback(undefined);
    }
}
