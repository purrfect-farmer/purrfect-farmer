import { AuthKey } from '../crypto/AuthKey';
import Session from './Abstract';
// Dummy implementation
export default class MemorySession extends Session {
    _serverAddress;
    _dcId;
    _port;
    _takeoutId;
    _entities;
    _isTestServer;
    constructor() {
        super();
        this._serverAddress = undefined;
        this._dcId = 0;
        this._port = undefined;
        this._takeoutId = undefined;
        this._isTestServer = false;
        this._entities = new Set();
    }
    get dcId() {
        return this._dcId;
    }
    get serverAddress() {
        return this._serverAddress;
    }
    get port() {
        return this._port;
    }
    get isTestServer() {
        return this._isTestServer;
    }
    setDC(dcId, serverAddress, port, isTestServer) {
        this._dcId = dcId | 0;
        this._serverAddress = serverAddress;
        this._port = port;
        this._isTestServer = isTestServer;
    }
    getAuthKey(dcId) {
        return new AuthKey();
    }
    setAuthKey(authKey, dcId) { }
    async load() { }
    save() { }
    delete() { }
}
