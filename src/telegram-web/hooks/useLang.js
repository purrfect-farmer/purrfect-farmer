import { addLocalizationCallback, getTranslationFn, } from '../util/localization';
import useEffectOnce from './useEffectOnce';
import useForceUpdate from './useForceUpdate';
const useLang = () => {
    const forceUpdate = useForceUpdate();
    useEffectOnce(() => {
        return addLocalizationCallback(forceUpdate);
    });
    return getTranslationFn();
};
export default useLang;
