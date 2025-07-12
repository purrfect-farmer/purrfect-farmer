import Api from '../../tl/api';
import createMockedTypeInputPeer from './createMockedTypeInputPeer';
export default function createMockedDialogFilter(id, mockData) {
    const dialogFilter = mockData.dialogFilters.find((dialogFilter) => dialogFilter.id === id);
    if (!dialogFilter)
        throw Error('No such dialog filter ' + id);
    const { includePeerIds = [], pinnedPeerIds = [], excludePeerIds = [], ...rest } = dialogFilter;
    return new Api.DialogFilter({
        ...rest,
        id,
        includePeers: includePeerIds.map((peer) => createMockedTypeInputPeer(peer, mockData)),
        pinnedPeers: pinnedPeerIds.map((peer) => createMockedTypeInputPeer(peer, mockData)),
        excludePeers: excludePeerIds.map((peer) => createMockedTypeInputPeer(peer, mockData)),
    });
}
