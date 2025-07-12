export default function getKeyFromEvent(e) {
    const key = e.key || e.code;
    return key.startsWith('Key') ? key.slice(3).toLowerCase() : key;
}
