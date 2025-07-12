const MAX_NESTING_PARENTS = 5;
export function isSelectionInsideInput(selectionRange, inputId) {
    const { commonAncestorContainer } = selectionRange;
    let parentNode = commonAncestorContainer;
    let iterations = 1;
    while (parentNode && parentNode.id !== inputId && iterations < MAX_NESTING_PARENTS) {
        parentNode = parentNode.parentElement;
        iterations++;
    }
    return Boolean(parentNode && parentNode.id === inputId);
}
