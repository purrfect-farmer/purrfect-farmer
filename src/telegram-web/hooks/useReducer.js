import { useCallback, useRef } from '../lib/teact/teact';
import useForceUpdate from './useForceUpdate';
export default function useReducer(reducer, initialState) {
    const forceUpdate = useForceUpdate();
    const reducerRef = useRef(reducer);
    const state = useRef(initialState);
    const dispatch = useCallback((action) => {
        state.current = reducerRef.current(state.current, action);
        forceUpdate();
        return state.current;
    }, []);
    return [
        state.current,
        dispatch,
    ];
}
