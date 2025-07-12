export default function buildClassName(...parts) {
    return parts.filter(Boolean).join(' ');
}
export function createClassNameBuilder(componentName) {
    return ((elementName, ...modifiers) => {
        const baseName = elementName === '&' ? componentName : `${componentName}__${elementName}`;
        return modifiers.reduce((acc, modifier) => {
            if (modifier) {
                // A bit hacky way to pass global class names
                if (Array.isArray(modifier)) {
                    acc.push(...modifier);
                }
                else {
                    acc.push(`${baseName}--${modifier}`);
                }
            }
            return acc;
        }, [baseName]).join(' ');
    });
}
