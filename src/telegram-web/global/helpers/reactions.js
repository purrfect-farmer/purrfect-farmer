export function getMessageRecentReaction(message) {
    return message.isOutgoing ? message.reactions?.recentReactions?.[0] : undefined;
}
export function checkIfHasUnreadReactions(global, reactions) {
    const { currentUserId } = global;
    return reactions?.recentReactions?.some(({ isUnread, isOwn, peerId }) => isUnread && !isOwn && currentUserId !== peerId);
}
export function areReactionsEmpty(reactions) {
    return !reactions.results.some(({ count, localAmount }) => count || localAmount);
}
export function getReactionKey(reaction) {
    switch (reaction.type) {
        case 'emoji':
            return `emoji-${reaction.emoticon}`;
        case 'custom':
            return `document-${reaction.documentId}`;
        case 'paid':
            return 'paid';
        default: {
            // Legacy reactions
            const uniqueValue = reaction.emoticon || reaction.documentId;
            return `unsupported-${uniqueValue}`;
        }
    }
}
export function isSameReaction(first, second) {
    if (first === second) {
        return true;
    }
    if (!first || !second) {
        return false;
    }
    return getReactionKey(first) === getReactionKey(second);
}
export function canSendReaction(reaction, chatReactions) {
    if (chatReactions.type === 'all') {
        return reaction.type === 'emoji' || chatReactions.areCustomAllowed;
    }
    if (chatReactions.type === 'some') {
        return chatReactions.allowed.some((r) => isSameReaction(r, reaction));
    }
    return false;
}
export function sortReactions(reactions, topReactions) {
    return reactions.slice().sort((left, right) => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- TS Bug?
        const reactionOne = left ? ('reaction' in left ? left.reaction : left) : undefined;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- TS Bug?
        const reactionTwo = right ? ('reaction' in right ? right.reaction : right) : undefined;
        if (reactionOne?.type === 'paid')
            return -1;
        if (reactionTwo?.type === 'paid')
            return 1;
        const indexOne = topReactions?.findIndex((reaction) => isSameReaction(reaction, reactionOne)) || 0;
        const indexTwo = topReactions?.findIndex((reaction) => isSameReaction(reaction, reactionTwo)) || 0;
        return ((indexOne > -1 ? indexOne : Infinity) - (indexTwo > -1 ? indexTwo : Infinity));
    });
}
export function getUserReactions(message) {
    return message.reactions?.results?.filter((r) => isReactionChosen(r))
        .sort((a, b) => a.chosenOrder - b.chosenOrder)
        .map((r) => r.reaction) || [];
}
export function isReactionChosen(reaction) {
    return reaction.chosenOrder !== undefined;
}
export function updateReactionCount(reactionCount, newReactions) {
    const results = reactionCount.map((current) => (isReactionChosen(current) ? {
        ...current,
        chosenOrder: undefined,
        count: current.count - 1,
    } : current)).filter(({ count }) => count > 0);
    newReactions.forEach((reaction, i) => {
        const existingIndex = results.findIndex((r) => isSameReaction(r.reaction, reaction));
        if (existingIndex > -1) {
            results[existingIndex] = {
                ...results[existingIndex],
                chosenOrder: i,
                count: results[existingIndex].count + 1,
            };
        }
        else {
            results.push({
                reaction,
                chosenOrder: i,
                count: 1,
            });
        }
    });
    return results;
}
export function addPaidReaction(reactionCount, count, isAnonymous, peerId) {
    const results = [];
    const hasPaid = reactionCount.some((current) => current.reaction.type === 'paid');
    if (hasPaid) {
        reactionCount.forEach((current) => {
            if (current.reaction.type === 'paid') {
                results.push({
                    ...current,
                    localAmount: (current.localAmount || 0) + count,
                    chosenOrder: -1,
                    localIsPrivate: isAnonymous !== undefined ? isAnonymous : current.localIsPrivate,
                    localPeerId: peerId || current.localPeerId,
                    localPreviousChosenOrder: current.chosenOrder,
                });
                return;
            }
            results.push(current);
        });
        return results;
    }
    return [
        {
            reaction: { type: 'paid' },
            count: 0,
            chosenOrder: -1,
            localAmount: count,
            localIsPrivate: isAnonymous,
            localPeerId: peerId,
        },
        ...reactionCount,
    ];
}
