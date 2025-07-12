export function isSelectionRangeInsideMessage(range) {
    const ancestor = range.commonAncestorContainer;
    const el = ancestor.nodeType === Node.TEXT_NODE
        ? ancestor.parentNode
        : ancestor;
    return Boolean(el.closest('.message-content-wrapper .text-content'))
        && !(Boolean(el.closest('.EmbeddedMessage')) || Boolean(el.closest('.WebPage')));
}
