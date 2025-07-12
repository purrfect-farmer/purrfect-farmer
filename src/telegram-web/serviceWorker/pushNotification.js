import { APP_NAME, DEBUG, DEBUG_MORE } from '../config';
var Boolean;
(function (Boolean) {
    Boolean["True"] = "1";
    Boolean["False"] = "0";
})(Boolean || (Boolean = {}));
let lastSyncAt = new Date().valueOf();
const shownNotifications = new Set();
const clickBuffer = {};
function getPushData(e) {
    try {
        return e.data.json();
    }
    catch (error) {
        if (DEBUG) {
            // eslint-disable-next-line no-console
            console.log('[SW] Unable to parse push notification data', e.data);
        }
        return undefined;
    }
}
function getChatId(data) {
    if (data.custom.from_id) {
        return data.custom.from_id;
    }
    // Chats and channels have “negative” IDs
    if (data.custom.chat_id || data.custom.channel_id) {
        return `-${data.custom.chat_id || data.custom.channel_id}`;
    }
    return undefined;
}
function getMessageId(data) {
    if (!data.custom.msg_id)
        return undefined;
    return parseInt(data.custom.msg_id, 10);
}
function getNotificationData(data) {
    let title = data.title || APP_NAME;
    const isSilent = data.custom?.silent === Boolean.True;
    if (isSilent) {
        title += ' 🔕';
    }
    return {
        chatId: getChatId(data),
        messageId: getMessageId(data),
        body: data.description,
        isSilent,
        title,
    };
}
async function getClients() {
    const appUrl = new URL(self.registration.scope).origin;
    const clients = await self.clients.matchAll({ type: 'window' });
    return clients.filter((client) => {
        return new URL(client.url).origin === appUrl;
    });
}
async function playNotificationSound(id) {
    const clients = await getClients();
    const client = clients[0];
    if (!client)
        return;
    client.postMessage({
        type: 'playNotificationSound',
        payload: { id },
    });
}
function showNotification({ chatId, messageId, body, title, icon, reaction, isSilent, shouldReplaceHistory, }) {
    const isFirstBatch = new Date().valueOf() - lastSyncAt < 1000;
    const tag = String(isFirstBatch ? 0 : chatId || 0);
    const options = {
        body,
        data: {
            chatId,
            messageId,
            reaction,
            count: 1,
            shouldReplaceHistory,
        },
        icon: icon || 'icon-192x192.png',
        badge: 'icon-192x192.png',
        tag,
        // @ts-ignore
        vibrate: [200, 100, 200],
    };
    return Promise.all([
        // TODO Update condition when reaction badges are implemented
        (!reaction && !isSilent) ? playNotificationSound(String(messageId) || chatId || '') : undefined,
        self.registration.showNotification(title, options),
    ]);
}
async function closeNotifications({ chatId, lastReadInboxMessageId, }) {
    const notifications = await self.registration.getNotifications();
    const lastMessageId = lastReadInboxMessageId || Number.MAX_VALUE;
    notifications.forEach((notification) => {
        if (notification.tag === '0'
            || (notification.data.chatId === chatId && notification.data.messageId <= lastMessageId)) {
            notification.close();
        }
    });
}
export function handlePush(e) {
    if (DEBUG) {
        // eslint-disable-next-line no-console
        console.log('[SW] Push received event', e);
        if (e.data) {
            // eslint-disable-next-line no-console
            console.log('[SW] Push received with data', e.data.json());
        }
    }
    const data = getPushData(e);
    // Do not show muted notifications
    if (!data || data.mute === Boolean.True)
        return;
    const notification = getNotificationData(data);
    // Don't show already triggered notification
    if (shownNotifications.has(notification.messageId)) {
        shownNotifications.delete(notification.messageId);
        return;
    }
    e.waitUntil(showNotification(notification));
}
async function focusChatMessage(client, data) {
    if (!data.chatId)
        return;
    client.postMessage({
        type: 'focusMessage',
        payload: data,
    });
    if (!client.focused) {
        // Catch "focus not allowed" DOM Exceptions
        try {
            await client.focus();
        }
        catch (error) {
            if (DEBUG) {
                // eslint-disable-next-line no-console
                console.warn('[SW] ', error);
            }
        }
    }
}
export function handleNotificationClick(e) {
    const appUrl = self.registration.scope;
    e.notification.close(); // Android needs explicit close.
    const { data } = e.notification;
    const notifyClients = async () => {
        const clients = await getClients();
        await Promise.all(clients.map((client) => {
            clickBuffer[client.id] = data;
            return focusChatMessage(client, data);
        }));
        if (!self.clients.openWindow || clients.length > 0)
            return undefined;
        // Store notification data for default client (fix for android)
        clickBuffer[0] = data;
        // If there is no opened client we need to open one and wait until it is fully loaded
        try {
            const newClient = await self.clients.openWindow(appUrl);
            if (newClient) {
                // Store notification data until client is fully loaded
                clickBuffer[newClient.id] = data;
            }
        }
        catch (error) {
            if (DEBUG) {
                // eslint-disable-next-line no-console
                console.warn('[SW] ', error);
            }
        }
        return undefined;
    };
    e.waitUntil(notifyClients());
}
export function handleClientMessage(e) {
    if (DEBUG_MORE) {
        // eslint-disable-next-line no-console
        console.log('[SW] New message from client', e);
    }
    if (!e.data)
        return;
    const source = e.source;
    if (e.data.type === 'clientReady') {
        // focus on chat message when client is fully ready
        const data = clickBuffer[source.id] || clickBuffer[0];
        if (data) {
            delete clickBuffer[source.id];
            delete clickBuffer[0];
            e.waitUntil(focusChatMessage(source, data));
        }
    }
    if (e.data.type === 'showMessageNotification') {
        // store messageId for already shown notification
        const notification = e.data.payload;
        e.waitUntil((async () => {
            // Close existing notification if it is already shown
            if (notification.chatId) {
                const notifications = await self.registration.getNotifications({ tag: notification.chatId });
                notifications.forEach((n) => n.close());
            }
            // Mark this notification as shown if it was handled locally
            shownNotifications.add(notification.messageId);
            return showNotification(notification);
        })());
    }
    if (e.data.type === 'closeMessageNotifications') {
        e.waitUntil(closeNotifications(e.data.payload));
    }
}
self.addEventListener('sync', () => {
    lastSyncAt = Date.now();
});
