import useDerivedState from '../useDerivedState';
import useSelectorSignal from './useSelectorSignal';
export default function useSelector(selector) {
    const selectorSignal = useSelectorSignal(selector);
    return useDerivedState(selectorSignal);
}
