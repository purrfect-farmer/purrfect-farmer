export default function cycleRestrict(length, index) {
    return index - Math.floor(index / length) * length;
}
