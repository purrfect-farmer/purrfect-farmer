import { DEBUG_MORE } from '../config';
import { handleError } from './handleError';
const SAFE_EXEC_ENABLED = !DEBUG_MORE;
export default function safeExec(cb, options) {
    if (!SAFE_EXEC_ENABLED) {
        return cb();
    }
    const { rescue, always, shouldIgnoreError } = options ?? {};
    try {
        return cb();
    }
    catch (err) {
        rescue?.(err);
        if (!shouldIgnoreError) {
            handleError(err);
        }
        return undefined;
    }
    finally {
        always?.();
    }
}
