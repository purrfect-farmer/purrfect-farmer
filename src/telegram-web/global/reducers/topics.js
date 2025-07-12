import { buildCollectionByKey, omit, unique } from '../../util/iteratees';
import { selectChat, selectTopic, selectTopics, selectTopicsInfo, } from '../selectors';
import { updateThread, updateThreadInfo } from './messages';
function updateTopicsStore(global, chatId, update) {
    const info = global.chats.topicsInfoById[chatId] || {};
    global = {
        ...global,
        chats: {
            ...global.chats,
            topicsInfoById: {
                ...global.chats.topicsInfoById,
                [chatId]: {
                    ...info,
                    ...update,
                },
            },
        },
    };
    return global;
}
export function updateListedTopicIds(global, chatId, topicIds) {
    const listedIds = selectTopicsInfo(global, chatId)?.listedTopicIds || [];
    return updateTopicsStore(global, chatId, {
        listedTopicIds: unique([
            ...listedIds,
            ...topicIds,
        ]),
    });
}
export function updateTopics(global, chatId, topicsCount, topics) {
    const oldTopics = selectTopics(global, chatId);
    const newTopics = buildCollectionByKey(topics, 'id');
    global = updateTopicsStore(global, chatId, {
        topicsById: {
            ...oldTopics,
            ...newTopics,
        },
        totalCount: topicsCount,
    });
    topics.forEach((topic) => {
        global = updateThread(global, chatId, topic.id, {
            firstMessageId: topic.id,
        });
        global = updateThreadInfo(global, chatId, topic.id, {
            lastMessageId: topic.lastMessageId,
            threadId: topic.id,
            chatId,
        });
    });
    return global;
}
export function updateTopic(global, chatId, topicId, update) {
    const chat = selectChat(global, chatId);
    if (!chat)
        return global;
    const topic = selectTopic(global, chatId, topicId);
    const oldTopics = selectTopics(global, chatId);
    const updatedTopic = {
        ...topic,
        ...update,
    };
    if (!updatedTopic.id)
        return global;
    global = updateTopicsStore(global, chatId, {
        topicsById: {
            ...oldTopics,
            [topicId]: updatedTopic,
        },
    });
    global = updateThread(global, chatId, updatedTopic.id, {
        firstMessageId: updatedTopic.id,
    });
    global = updateThreadInfo(global, chatId, updatedTopic.id, {
        lastMessageId: updatedTopic.lastMessageId,
        threadId: updatedTopic.id,
        chatId,
    });
    return global;
}
export function deleteTopic(global, chatId, topicId) {
    const topics = selectTopics(global, chatId);
    if (!topics)
        return global;
    global = updateTopicsStore(global, chatId, {
        topicsById: omit(topics, [topicId]),
    });
    return global;
}
export function updateTopicLastMessageId(global, chatId, threadId, lastMessageId) {
    return updateTopic(global, chatId, threadId, {
        lastMessageId,
    });
}
export function replacePinnedTopicIds(global, chatId, pinnedTopicIds) {
    return updateTopicsStore(global, chatId, {
        orderedPinnedTopicIds: pinnedTopicIds,
    });
}
