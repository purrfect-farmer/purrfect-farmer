import { MESSAGE_CONTENT_CLASS_NAME } from '../config';
const ELEMENT_NODE = 1;
export default function getMessageIdsForSelectedText() {
    const selection = window.getSelection();
    let selectedFragments = selection?.rangeCount ? selection.getRangeAt(0).cloneContents() : undefined;
    const shouldIncludeLastMessage = selection?.focusNode && selection.focusOffset > 0
        && hasParentWithClassName(selection.focusNode, MESSAGE_CONTENT_CLASS_NAME);
    if (!selectedFragments || selectedFragments.childElementCount === 0) {
        return undefined;
    }
    const messageIds = Array.from(selectedFragments.children)
        .reduce((result, node) => {
        if (node.nodeType === ELEMENT_NODE && node.classList.contains('message-date-group')) {
            return Array.from(node.querySelectorAll('.Message'))
                .reduce((acc, messageEl) => acc.concat(Number(messageEl.dataset.messageId)), result);
        }
        else if (node.nodeType === ELEMENT_NODE && node.classList.contains('Message')) {
            return result.concat(Number(node.dataset.messageId));
        }
        return result;
    }, []);
    // Cleanup a document fragment because it is playing media content in the background
    while (selectedFragments.firstChild) {
        selectedFragments.removeChild(selectedFragments.firstChild);
    }
    selectedFragments = undefined;
    if (!shouldIncludeLastMessage) {
        messageIds.pop();
    }
    return messageIds;
}
function hasParentWithClassName(element, className) {
    if (element.nodeType === ELEMENT_NODE && element.classList.contains(className)) {
        return true;
    }
    return element.parentNode ? hasParentWithClassName(element.parentNode, className) : false;
}
