import { useEffect } from '../lib/teact/teact';
import { addLoadListener, getModuleFromMemory, loadModule } from '../util/moduleLoader';
import useForceUpdate from './useForceUpdate';
const useModuleLoader = (bundleName, moduleName, noLoad = false, autoUpdate = false) => {
    const module = getModuleFromMemory(bundleName, moduleName);
    const forceUpdate = useForceUpdate();
    useEffect(() => {
        if (!autoUpdate) {
            return undefined;
        }
        return addLoadListener(forceUpdate);
    }, [autoUpdate, forceUpdate]);
    useEffect(() => {
        if (!noLoad && !module) {
            loadModule(bundleName).then(forceUpdate);
        }
    }, [bundleName, forceUpdate, module, moduleName, noLoad]);
    return module;
};
export default useModuleLoader;
