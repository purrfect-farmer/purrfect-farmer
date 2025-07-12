export function getBasicListFormat() {
    return {
        format: (items) => items.join(', '),
        formatToParts: (items) => {
            const result = [];
            items.forEach((item, i) => {
                if (i > 0) {
                    result.push({ type: 'literal', value: ', ' });
                }
                result.push({ type: 'element', value: item });
            });
            return result;
        },
    };
}
