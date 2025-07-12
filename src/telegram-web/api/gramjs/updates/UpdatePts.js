export class LocalUpdatePts {
    pts;
    ptsCount;
    constructor(pts, ptsCount) {
        this.pts = pts;
        this.ptsCount = ptsCount;
    }
}
export class LocalUpdateChannelPts {
    channelId;
    pts;
    ptsCount;
    constructor(channelId, pts, ptsCount) {
        this.channelId = channelId;
        this.pts = pts;
        this.ptsCount = ptsCount;
    }
}
export function buildLocalUpdatePts(pts, ptsCount, channelId) {
    return channelId ? new LocalUpdateChannelPts(channelId, pts, ptsCount) : new LocalUpdatePts(pts, ptsCount);
}
