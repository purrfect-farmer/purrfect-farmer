import { useEffect, useState } from '../lib/teact/teact';
function useAsync(fn, deps, defaultValue) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState();
    const [result, setResult] = useState(defaultValue);
    useEffect(() => {
        setIsLoading(true);
        let wasCancelled = false;
        fn().then((res) => {
            if (wasCancelled)
                return;
            setIsLoading(false);
            setResult(res);
        }, (err) => {
            if (wasCancelled)
                return;
            setIsLoading(false);
            setError(err);
        });
        return () => {
            wasCancelled = true;
        };
        // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
    }, deps);
    return { isLoading, error, result };
}
;
export default useAsync;
