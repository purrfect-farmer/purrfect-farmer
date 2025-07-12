import { useCallback, useMemo } from '../lib/teact/teact';
import { throttle, throttleWith } from '../util/schedulers';
export default function useThrottledCallback(fn, deps, msOrSchedulerFn, noFirst = false) {
    // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
    const fnMemo = useCallback(fn, deps);
    return useMemo(() => {
        if (typeof msOrSchedulerFn === 'number') {
            return throttle(fnMemo, msOrSchedulerFn, !noFirst);
        }
        else {
            return throttleWith(msOrSchedulerFn, fnMemo);
        }
    }, [fnMemo, msOrSchedulerFn, noFirst]);
}
