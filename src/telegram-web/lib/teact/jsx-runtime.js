import Teact from './teact';
export const Fragment = Teact.Fragment;
function create(type, props = {}, key) {
    if (key !== undefined)
        props.key = key;
    const children = props.children;
    if (props.children !== undefined)
        props.children = undefined;
    return Teact.createElement(type, props, children);
}
export function jsx(type, props, key) {
    return create(type, props, key);
}
// Not implemented, reusing jsx for now
export const jsxs = jsx;
export const jsxDEV = jsx;
