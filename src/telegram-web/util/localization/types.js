/* GUARDS */
export function isDeletedLangString(string) {
    return typeof string === 'object' && 'isDeleted' in string;
}
export function isRegularLangString(string) {
    return typeof string === 'string';
}
export function isPluralLangString(string) {
    return !isRegularLangString(string) && !isDeletedLangString(string);
}
export function isLangFnParam(object) {
    return Boolean(object) && typeof object === 'object' && 'key' in object && !('type' in object);
}
export function areAdvancedLangFnOptions(params) {
    return 'withNodes' in params && Boolean(params.withNodes);
}
