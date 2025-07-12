export function updateTwoFaSettings(global, update) {
    return {
        ...global,
        twoFaSettings: {
            ...global.twoFaSettings,
            ...update,
        },
    };
}
