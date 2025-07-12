import { getMediaThumbUri } from '../../../../global/helpers';
import useOffscreenCanvasBlur from '../../../../hooks/useOffscreenCanvasBlur';
export default function useBlurredMediaThumbRef(media, isDisabled) {
    const dataUri = media ? typeof media === 'string' ? media : getMediaThumbUri(media) : undefined;
    return useOffscreenCanvasBlur(dataUri, isDisabled);
}
