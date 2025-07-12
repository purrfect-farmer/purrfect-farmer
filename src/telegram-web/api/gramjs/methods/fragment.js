import { Api as GramJs } from '../../../lib/gramjs';
import { buildApiCollectibleInfo } from '../apiBuilders/misc';
import { invokeRequest } from './client';
export async function fetchCollectionInfo(collectible) {
    const inputCollectible = 'username' in collectible
        ? new GramJs.InputCollectibleUsername({ username: collectible.username })
        : new GramJs.InputCollectiblePhone({ phone: collectible.phone });
    const result = await invokeRequest(new GramJs.fragment.GetCollectibleInfo({
        collectible: inputCollectible,
    }));
    if (!result) {
        return undefined;
    }
    return buildApiCollectibleInfo(result);
}
