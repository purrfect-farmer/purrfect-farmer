export function selectSharedState(global) {
    return global.sharedState;
}
export function selectSharedSettings(global) {
    return selectSharedState(global).settings;
}
