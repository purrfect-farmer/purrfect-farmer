import { useEffect } from '../../lib/teact/teact';
import { onBeforeUnload } from '../../util/schedulers';
import useLastCallback from '../useLastCallback';
export default function useBeforeUnload(callback) {
    const lastCallback = useLastCallback(callback);
    useEffect(() => onBeforeUnload(lastCallback), [lastCallback]);
}
