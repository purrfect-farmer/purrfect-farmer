import { useCallback, useState } from '../lib/teact/teact';
const useForceUpdate = () => {
    const [, setTrigger] = useState(false);
    return useCallback(() => {
        setTrigger((trigger) => !trigger);
    }, []);
};
export default useForceUpdate;
