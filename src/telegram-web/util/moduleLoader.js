import { DEBUG } from '../config';
import { createCallbackManager } from './callbacks';
export var Bundles;
(function (Bundles) {
    Bundles[Bundles["Auth"] = 0] = "Auth";
    Bundles[Bundles["Main"] = 1] = "Main";
    Bundles[Bundles["Extra"] = 2] = "Extra";
    Bundles[Bundles["Calls"] = 3] = "Calls";
    Bundles[Bundles["Stars"] = 4] = "Stars";
})(Bundles || (Bundles = {}));
const LOAD_PROMISES = {};
const MEMORY_CACHE = {};
const { addCallback, runCallbacks } = createCallbackManager();
export async function loadBundle(bundleName) {
    if (!LOAD_PROMISES[bundleName]) {
        switch (bundleName) {
            case Bundles.Auth:
                LOAD_PROMISES[Bundles.Auth] = import(/* webpackChunkName: "BundleAuth" */ '../bundles/auth');
                break;
            case Bundles.Main:
                if (DEBUG) {
                    // eslint-disable-next-line no-console
                    console.log('>>> START LOAD MAIN BUNDLE');
                }
                LOAD_PROMISES[Bundles.Main] = import(/* webpackChunkName: "BundleMain" */ '../bundles/main');
                break;
            case Bundles.Extra:
                LOAD_PROMISES[Bundles.Extra] = import(/* webpackChunkName: "BundleExtra" */ '../bundles/extra');
                break;
            case Bundles.Calls:
                LOAD_PROMISES[Bundles.Calls] = import(/* webpackChunkName: "BundleCalls" */ '../bundles/calls');
                break;
            case Bundles.Stars:
                LOAD_PROMISES[Bundles.Stars] = import(/* webpackChunkName: "BundleStars" */ '../bundles/stars');
                break;
        }
        (LOAD_PROMISES[bundleName]).then(runCallbacks);
    }
    const bundle = (await LOAD_PROMISES[bundleName]);
    if (!MEMORY_CACHE[bundleName]) {
        MEMORY_CACHE[bundleName] = bundle;
    }
    return bundle;
}
export async function loadModule(bundleName) {
    await loadBundle(bundleName);
}
export function getModuleFromMemory(bundleName, moduleName) {
    const bundle = MEMORY_CACHE[bundleName];
    if (!bundle) {
        return undefined;
    }
    return bundle[moduleName];
}
export const addLoadListener = addCallback;
