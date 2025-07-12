export default function getPointerPosition(e) {
    if ('touches' in e) {
        return {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
        };
    }
    return {
        x: e.clientX,
        y: e.clientY,
    };
}
