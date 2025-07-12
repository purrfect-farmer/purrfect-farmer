import { addActionHandler, setGlobal } from '../../index';
import { addNotifyException, updateNotifyDefaults, updateTopic, } from '../../reducers';
addActionHandler('apiUpdate', (global, actions, update) => {
    switch (update['@type']) {
        case 'updateDefaultNotifySettings': {
            return updateNotifyDefaults(global, update.peerType, update.settings);
        }
        case 'updateChatNotifySettings': {
            const { chatId, settings, } = update;
            global = addNotifyException(global, chatId, settings);
            setGlobal(global);
            break;
        }
        case 'updateTopicNotifySettings': {
            const { chatId, topicId, settings, } = update;
            global = updateTopic(global, chatId, topicId, { notifySettings: settings });
            setGlobal(global);
            break;
        }
    }
    return undefined;
});
