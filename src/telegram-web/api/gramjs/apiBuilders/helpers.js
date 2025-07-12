export function bytesToDataUri(bytes, shouldOmitPrefix = false, mimeType = 'image/jpeg') {
    const prefix = shouldOmitPrefix ? '' : `data:${mimeType};base64,`;
    return `${prefix}${btoa(String.fromCharCode(...bytes))}`;
}
export function omitVirtualClassFields(instance) {
    const { flags, CONSTRUCTOR_ID, SUBCLASS_OF_ID, className, classType, getBytes, ...rest } = instance;
    return rest;
}
