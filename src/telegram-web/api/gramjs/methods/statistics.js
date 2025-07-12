import BigInt from 'big-integer';
import { Api as GramJs } from '../../../lib/gramjs';
import { STATISTICS_PUBLIC_FORWARDS_LIMIT } from '../../../config';
import { buildChannelMonetizationStatistics, buildChannelStatistics, buildGraph, buildGroupStatistics, buildMessagePublicForwards, buildPostsStatistics, buildStoryPublicForwards, } from '../apiBuilders/statistics';
import { buildInputChannel, buildInputPeer, DEFAULT_PRIMITIVES } from '../gramjsBuilders';
import { checkErrorType, wrapError } from '../helpers/misc';
import { invokeRequest } from './client';
import { getPassword } from './twoFaSettings';
export async function fetchChannelStatistics({ chat, dcId, }) {
    const result = await invokeRequest(new GramJs.stats.GetBroadcastStats({
        channel: buildInputChannel(chat.id, chat.accessHash),
    }), {
        dcId,
    });
    if (!result) {
        return undefined;
    }
    return {
        stats: buildChannelStatistics(result),
        users: [],
    };
}
export async function fetchChannelMonetizationStatistics({ peer, dcId, }) {
    const result = await invokeRequest(new GramJs.stats.GetBroadcastRevenueStats({
        peer: buildInputPeer(peer.id, peer.accessHash),
    }), {
        dcId,
    });
    if (!result) {
        return undefined;
    }
    return buildChannelMonetizationStatistics(result);
}
export async function fetchGroupStatistics({ chat, dcId, }) {
    const result = await invokeRequest(new GramJs.stats.GetMegagroupStats({
        channel: buildInputChannel(chat.id, chat.accessHash),
    }), {
        dcId,
    });
    if (!result) {
        return undefined;
    }
    return {
        stats: buildGroupStatistics(result),
    };
}
export async function fetchMessageStatistics({ chat, messageId, dcId, }) {
    const result = await invokeRequest(new GramJs.stats.GetMessageStats({
        channel: buildInputChannel(chat.id, chat.accessHash),
        msgId: messageId,
    }), {
        dcId,
    });
    if (!result) {
        return undefined;
    }
    return buildPostsStatistics(result);
}
export async function fetchMessagePublicForwards({ chat, messageId, dcId, offset = DEFAULT_PRIMITIVES.STRING, }) {
    const result = await invokeRequest(new GramJs.stats.GetMessagePublicForwards({
        channel: buildInputChannel(chat.id, chat.accessHash),
        msgId: messageId,
        offset,
        limit: STATISTICS_PUBLIC_FORWARDS_LIMIT,
    }), {
        dcId,
    });
    if (!result) {
        return undefined;
    }
    return {
        forwards: buildMessagePublicForwards(result),
        count: result.count,
        nextOffset: result.nextOffset,
    };
}
export async function fetchStatisticsAsyncGraph({ token, x, isPercentage, dcId, }) {
    const result = await invokeRequest(new GramJs.stats.LoadAsyncGraph({
        token,
        ...(x && { x: BigInt(x) }),
    }), {
        dcId,
    });
    if (!result) {
        return undefined;
    }
    return buildGraph(result, isPercentage);
}
export async function fetchStoryStatistics({ chat, storyId, dcId, }) {
    const result = await invokeRequest(new GramJs.stats.GetStoryStats({
        peer: buildInputPeer(chat.id, chat.accessHash),
        id: storyId,
    }), {
        dcId,
    });
    if (!result) {
        return undefined;
    }
    return buildPostsStatistics(result);
}
export async function fetchStoryPublicForwards({ chat, storyId, dcId, offset = DEFAULT_PRIMITIVES.STRING, }) {
    const result = await invokeRequest(new GramJs.stats.GetStoryPublicForwards({
        peer: buildInputPeer(chat.id, chat.accessHash),
        id: storyId,
        offset,
        limit: STATISTICS_PUBLIC_FORWARDS_LIMIT,
    }), {
        dcId,
    });
    if (!result) {
        return undefined;
    }
    return {
        publicForwards: buildStoryPublicForwards(result),
        count: result.count,
        nextOffset: result.nextOffset,
    };
}
export async function fetchMonetizationRevenueWithdrawalUrl({ peer, currentPassword, }) {
    try {
        const password = await getPassword(currentPassword);
        if (!password) {
            return undefined;
        }
        if ('error' in password) {
            return password;
        }
        const result = await invokeRequest(new GramJs.stats.GetBroadcastRevenueWithdrawalUrl({
            peer: buildInputPeer(peer.id, peer.accessHash),
            password,
        }), {
            shouldThrow: true,
        });
        if (!result) {
            return undefined;
        }
        return { url: result.url };
    }
    catch (err) {
        if (!checkErrorType(err))
            return undefined;
        return wrapError(err);
    }
    return undefined;
}
