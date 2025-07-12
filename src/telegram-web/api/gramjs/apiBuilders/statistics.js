import { Api as GramJs } from '../../../lib/gramjs';
import { buildApiUsernames, buildAvatarPhotoId } from './common';
import { buildApiPeerId, getApiChatIdFromMtpPeer } from './peers';
const DECIMALS = 10 ** 9;
export function buildChannelStatistics(stats) {
    return {
        // Graphs
        growthGraph: buildGraph(stats.growthGraph),
        followersGraph: buildGraph(stats.followersGraph),
        muteGraph: buildGraph(stats.muteGraph),
        topHoursGraph: buildGraph(stats.topHoursGraph),
        // Async graphs
        languagesGraph: stats.languagesGraph.token,
        viewsBySourceGraph: stats.viewsBySourceGraph.token,
        newFollowersBySourceGraph: stats.newFollowersBySourceGraph.token,
        interactionsGraph: stats.interactionsGraph.token,
        reactionsByEmotionGraph: stats.reactionsByEmotionGraph.token,
        storyInteractionsGraph: stats.storyInteractionsGraph.token,
        storyReactionsByEmotionGraph: stats.storyReactionsByEmotionGraph.token,
        // Statistics overview
        followers: buildStatisticsOverview(stats.followers),
        viewsPerPost: buildStatisticsOverview(stats.viewsPerPost),
        sharesPerPost: buildStatisticsOverview(stats.sharesPerPost),
        enabledNotifications: buildStatisticsPercentage(stats.enabledNotifications),
        reactionsPerPost: buildStatisticsOverview(stats.reactionsPerPost),
        viewsPerStory: buildStatisticsOverview(stats.viewsPerStory),
        sharesPerStory: buildStatisticsOverview(stats.sharesPerStory),
        reactionsPerStory: buildStatisticsOverview(stats.reactionsPerStory),
        // Recent posts
        recentPosts: stats.recentPostsInteractions.map(buildApiPostInteractionCounter).filter(Boolean),
    };
}
export function buildChannelMonetizationStatistics(stats) {
    return {
        // Graphs
        topHoursGraph: buildGraph(stats.topHoursGraph),
        revenueGraph: buildGraph(stats.revenueGraph, undefined, true, stats.usdRate),
        // Statistics overview
        balances: buildChannelMonetizationBalances(stats.balances),
        usdRate: stats.usdRate,
    };
}
export function buildApiPostInteractionCounter(interaction) {
    if (interaction instanceof GramJs.PostInteractionCountersMessage) {
        return {
            msgId: interaction.msgId,
            forwardsCount: interaction.forwards,
            viewsCount: interaction.views,
            reactionsCount: interaction.reactions,
        };
    }
    if (interaction instanceof GramJs.PostInteractionCountersStory) {
        return {
            storyId: interaction.storyId,
            reactionsCount: interaction.reactions,
            viewsCount: interaction.views,
            forwardsCount: interaction.forwards,
        };
    }
    return undefined;
}
export function buildGroupStatistics(stats) {
    return {
        // Graphs
        growthGraph: buildGraph(stats.growthGraph),
        membersGraph: buildGraph(stats.membersGraph),
        topHoursGraph: buildGraph(stats.topHoursGraph),
        // Async graphs
        languagesGraph: stats.languagesGraph.token,
        messagesGraph: stats.messagesGraph.token,
        actionsGraph: stats.actionsGraph.token,
        // Statistics overview
        period: getOverviewPeriod(stats.period),
        members: buildStatisticsOverview(stats.members),
        viewers: buildStatisticsOverview(stats.viewers),
        messages: buildStatisticsOverview(stats.messages),
        posters: buildStatisticsOverview(stats.posters),
    };
}
export function buildPostsStatistics(stats) {
    return {
        viewsGraph: buildGraph(stats.viewsGraph),
        reactionsGraph: buildGraph(stats.reactionsByEmotionGraph),
    };
}
export function buildMessagePublicForwards(result) {
    if (!result) {
        return undefined;
    }
    return result.forwards.map((forward) => {
        if (forward instanceof GramJs.PublicForwardStory)
            return undefined;
        return buildApiMessagePublicForward(forward.message, result.chats);
    }).filter(Boolean);
}
export function buildStoryPublicForwards(result) {
    if (!result || !('forwards' in result)) {
        return undefined;
    }
    return result.forwards.map((forward) => {
        if (forward instanceof GramJs.PublicForwardMessage) {
            return buildApiMessagePublicForward(forward.message, result.chats);
        }
        const { peer, story } = forward;
        const peerId = getApiChatIdFromMtpPeer(peer);
        return {
            peerId,
            storyId: story.id,
            viewsCount: story.views?.viewsCount || 0,
            reactionsCount: story.views?.reactionsCount || 0,
        };
    });
}
export function buildGraph(result, isPercentage, isCurrency, currencyRate) {
    if (result.error) {
        return undefined;
    }
    const data = JSON.parse(result.json.data);
    const [x, ...y] = data.columns;
    const hasSecondYAxis = data.y_scaled;
    return {
        type: isPercentage ? 'area' : data.types.y0,
        zoomToken: result.zoomToken,
        labelFormatter: data.xTickFormatter,
        tooltipFormatter: data.xTooltipFormatter,
        labels: x.slice(1),
        hideCaption: !data.subchart.show,
        hasSecondYAxis,
        isStacked: data.stacked && !hasSecondYAxis,
        isPercentage,
        isCurrency,
        currencyRate,
        datasets: y.map((item) => {
            const key = item[0];
            return {
                name: data.names[key],
                color: extractColor(data.colors[key]),
                values: item.slice(1),
            };
        }),
        ...calculateMinimapRange(data.subchart.defaultZoom, x.slice(1)),
    };
}
function extractColor(color) {
    return color.substring(color.indexOf('#'));
}
function calculateMinimapRange(range, values) {
    const [min, max] = range;
    let minIndex = 0;
    let maxIndex = values.length - 1;
    values.forEach((item, index) => {
        if (!minIndex && item >= min) {
            minIndex = index;
        }
        if (!maxIndex && item >= max) {
            maxIndex = index;
        }
    });
    const begin = Math.max(0, minIndex / (values.length - 1));
    const end = Math.min(1, maxIndex / (values.length - 1));
    return { minimapRange: { begin, end }, labelFromIndex: minIndex, labelToIndex: maxIndex };
}
function buildStatisticsOverview({ current, previous }) {
    const change = current - previous;
    return {
        current,
        change,
        percentage: (change ? ((Math.abs(change) / previous) * 100) : 0).toFixed(2),
    };
}
export function buildStatisticsPercentage(data) {
    return {
        part: data.part,
        total: data.total,
        percentage: ((data.part / data.total) * 100).toFixed(2),
    };
}
function getOverviewPeriod(data) {
    return {
        maxDate: data.maxDate,
        minDate: data.minDate,
    };
}
function buildApiMessagePublicForward(message, chats) {
    const peerId = getApiChatIdFromMtpPeer(message.peerId);
    const channel = chats.find((c) => buildApiPeerId(c.id, 'channel') === peerId);
    const channelProfilePhoto = channel && 'photo' in channel && channel.photo instanceof GramJs.ChatPhoto
        ? channel.photo : undefined;
    return {
        messageId: message.id,
        views: message.views,
        title: channel.title,
        chat: {
            id: peerId,
            type: 'chatTypeChannel',
            title: channel.title,
            usernames: buildApiUsernames(channel),
            avatarPhotoId: channelProfilePhoto && buildAvatarPhotoId(channelProfilePhoto),
            hasVideoAvatar: Boolean(channelProfilePhoto?.hasVideo),
        },
    };
}
function buildChannelMonetizationBalances({ currentBalance, availableBalance, overallRevenue, withdrawalEnabled, }) {
    return {
        currentBalance: Number(currentBalance) / DECIMALS,
        availableBalance: Number(availableBalance) / DECIMALS,
        overallRevenue: Number(overallRevenue) / DECIMALS,
        isWithdrawalEnabled: withdrawalEnabled,
    };
}
