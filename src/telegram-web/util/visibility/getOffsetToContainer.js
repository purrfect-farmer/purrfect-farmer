export default function getOffsetToContainer(element, container) {
    let offsetTop = 0;
    let offsetLeft = 0;
    let current = element;
    while (current && current !== container && !current.contains(container)) {
        offsetTop += current.offsetTop;
        offsetLeft += current.offsetLeft;
        current = current.offsetParent;
    }
    return { top: offsetTop, left: offsetLeft };
}
