import { useContextSignal } from '../../lib/teact/teact';
import useDerivedState from '../useDerivedState';
export default function useContext(context) {
    const signal = useContextSignal(context);
    return useDerivedState(signal);
}
