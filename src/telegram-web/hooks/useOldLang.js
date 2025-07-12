import * as langProvider from '../util/oldLangProvider';
import useEffectOnce from './useEffectOnce';
import useForceUpdate from './useForceUpdate';
/**
 * @deprecated
 */
const useOldLang = () => {
    const forceUpdate = useForceUpdate();
    useEffectOnce(() => {
        return langProvider.addCallback(forceUpdate);
    });
    return langProvider.getTranslationFn();
};
export default useOldLang;
