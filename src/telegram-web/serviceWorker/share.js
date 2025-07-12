import Deferred from '../util/Deferred';
const READY_CLIENT_DEFERREDS = new Map();
export async function respondForShare(e) {
    if (e.request.method === 'POST') {
        try {
            const formData = await e.request.formData();
            const data = parseFormData(formData);
            requestShare(data, e.resultingClientId);
        }
        catch (err) {
            // eslint-disable-next-line no-console
            console.warn('[SHARE] Failed to parse input data', err);
        }
    }
    return Response.redirect('.');
}
export function handleClientMessage(e) {
    const { source, data } = e;
    if (!source)
        return;
    if (data.type === 'clientReady') {
        const { id } = source;
        const deferred = READY_CLIENT_DEFERREDS.get(id);
        if (deferred) {
            deferred.resolve();
        }
        else {
            READY_CLIENT_DEFERREDS.set(id, Deferred.resolved());
        }
    }
}
async function requestShare(data, clientId) {
    const client = await self.clients.get(clientId);
    if (!client) {
        return;
    }
    await getClientReadyDeferred(clientId);
    client.postMessage({
        type: 'share',
        payload: data,
    });
}
function getClientReadyDeferred(clientId) {
    const deferred = READY_CLIENT_DEFERREDS.get(clientId);
    if (deferred) {
        return deferred.promise;
    }
    const newDeferred = new Deferred();
    READY_CLIENT_DEFERREDS.set(clientId, newDeferred);
    return newDeferred.promise;
}
function parseFormData(formData) {
    const files = formData.getAll('files');
    const title = formData.get('title');
    const text = formData.get('text');
    const url = formData.get('url');
    return {
        title,
        text,
        url,
        files,
    };
}
