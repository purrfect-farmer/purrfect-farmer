export function updateSharedState(global, update) {
    return {
        ...global,
        sharedState: {
            ...global.sharedState,
            ...update,
        },
    };
}
