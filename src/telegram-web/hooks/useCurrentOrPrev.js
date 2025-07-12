import usePreviousDeprecated from './usePreviousDeprecated';
export default function useCurrentOrPrev(current, shouldSkipUndefined = false, shouldForceCurrent = false) {
    const prev = usePreviousDeprecated(current, shouldSkipUndefined);
    // eslint-disable-next-line no-null/no-null
    return shouldForceCurrent || (current !== null && current !== undefined) ? current : prev;
}
