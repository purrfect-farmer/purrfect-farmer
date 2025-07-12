import { useEffect } from '../lib/teact/teact';
function useEffectOnce(effect) {
    // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
    useEffect(effect, []);
}
export default useEffectOnce;
