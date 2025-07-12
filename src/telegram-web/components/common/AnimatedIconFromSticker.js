import { memo } from '../../lib/teact/teact';
import { ApiMediaFormat } from '../../api/types';
import { getStickerMediaHash } from '../../global/helpers';
import useMedia from '../../hooks/useMedia';
import AnimatedIconWithPreview from './AnimatedIconWithPreview';
function AnimatedIconFromSticker(props) {
    const { sticker, noLoad, forcePreview, ...otherProps } = props;
    const thumbDataUri = sticker?.thumbnail?.dataUri;
    const localMediaHash = sticker && getStickerMediaHash(sticker, 'full');
    const previewBlobUrl = useMedia(sticker ? getStickerMediaHash(sticker, 'preview') : undefined, noLoad && !forcePreview, ApiMediaFormat.BlobUrl);
    const tgsUrl = useMedia(localMediaHash, noLoad);
    return (<AnimatedIconWithPreview tgsUrl={tgsUrl} previewUrl={previewBlobUrl} thumbDataUri={thumbDataUri} {...otherProps}/>);
}
export default memo(AnimatedIconFromSticker);
