import { useEffect } from '../../lib/teact/teact';
import useLastCallback from '../useLastCallback';
function useInterval(callback, delay, noFirst = false) {
    const savedCallback = useLastCallback(callback);
    useEffect(() => {
        if (delay === undefined) {
            return undefined;
        }
        const id = setInterval(() => savedCallback(), delay);
        if (!noFirst)
            savedCallback();
        return () => clearInterval(id);
    }, [delay, noFirst]);
}
export default useInterval;
