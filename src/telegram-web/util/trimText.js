export default function trimText(text, length) {
    if (!text || !length || text.length <= length) {
        return text;
    }
    return `${text.substring(0, length)}...`;
}
