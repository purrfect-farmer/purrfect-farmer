export default class BinaryWriter {
    _buffers;
    constructor(stream) {
        this._buffers = [stream];
    }
    write(buffer) {
        this._buffers.push(buffer);
    }
    getValue() {
        return Buffer.concat(this._buffers);
    }
}
