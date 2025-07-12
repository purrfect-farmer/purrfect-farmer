export default function buildStyle(...parts) {
    return parts.filter(Boolean).join(';');
}
