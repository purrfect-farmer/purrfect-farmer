import useForceUpdate from '../useForceUpdate';
import useInterval from './useInterval';
export default function useIntervalForceUpdate(interval) {
    const forceUpdate = useForceUpdate();
    useInterval(forceUpdate, interval, true);
}
