const UNIQUE_PLACEHOLDER_PREFIX = '$PLACEHOLDER-';
export function conjuctionWithNodes(langFn, nodes) {
    const placeholders = nodes.map((node, i) => `${UNIQUE_PLACEHOLDER_PREFIX}${i}`);
    const replaced = langFn.internalFormatters.conjunction.formatToParts(placeholders);
    const result = [];
    replaced.forEach((part) => {
        if (part.type === 'literal') {
            result.push(part.value);
            return;
        }
        const index = Number(part.value.slice(UNIQUE_PLACEHOLDER_PREFIX.length));
        result.push(nodes[index]);
    });
    return result;
}
export function disjunctionWithNodes(langFn, nodes) {
    const placeholders = nodes.map((node, i) => `${UNIQUE_PLACEHOLDER_PREFIX}${i}`);
    const replaced = langFn.internalFormatters.disjunction.formatToParts(placeholders);
    const result = [];
    replaced.forEach((part) => {
        if (part.type === 'literal') {
            result.push(part.value);
            return;
        }
        const index = Number(part.value.slice(UNIQUE_PLACEHOLDER_PREFIX.length));
        result.push(nodes[index]);
    });
    return result;
}
