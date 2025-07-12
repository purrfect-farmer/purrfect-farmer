export class UpdateConnectionState {
    static disconnected = -1;
    static connected = 1;
    static broken = 0;
    state;
    constructor(state) {
        this.state = state;
    }
}
export class UpdateServerTimeOffset {
    timeOffset;
    constructor(timeOffset) {
        this.timeOffset = timeOffset;
    }
}
