import { useMemo } from '../../../../lib/teact/teact';
export var ChatAnimationTypes;
(function (ChatAnimationTypes) {
    ChatAnimationTypes[ChatAnimationTypes["Move"] = 0] = "Move";
    ChatAnimationTypes[ChatAnimationTypes["Opacity"] = 1] = "Opacity";
    ChatAnimationTypes[ChatAnimationTypes["None"] = 2] = "None";
})(ChatAnimationTypes || (ChatAnimationTypes = {}));
export function useChatAnimationType(orderDiffById) {
    return useMemo(() => {
        const orderDiffs = Object.values(orderDiffById);
        const numberOfUp = orderDiffs.filter((diff) => diff < 0).length;
        const numberOfDown = orderDiffs.filter((diff) => diff > 0).length;
        return (chatId) => {
            const orderDiff = orderDiffById[chatId];
            if (orderDiff === 0) {
                return ChatAnimationTypes.None;
            }
            if (orderDiff === Infinity
                || orderDiff === -Infinity
                || (numberOfUp <= numberOfDown && orderDiff < 0)
                || (numberOfDown < numberOfUp && orderDiff > 0)) {
                return ChatAnimationTypes.Opacity;
            }
            return ChatAnimationTypes.Move;
        };
    }, [orderDiffById]);
}
