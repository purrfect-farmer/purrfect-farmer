import { useCallback, useState } from '../lib/teact/teact';
const useFlag = (initial = false, debugKey) => {
    const [value, setValue] = useState(initial, debugKey);
    const setTrue = useCallback(() => {
        setValue(true);
    }, []);
    const setFalse = useCallback(() => {
        setValue(false);
    }, []);
    return [value, setTrue, setFalse];
};
export default useFlag;
