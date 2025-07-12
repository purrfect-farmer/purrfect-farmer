import { memo, useRef } from '../../../lib/teact/teact';
import { withGlobal } from '../../../global';
import { selectTheme } from '../../../global/selectors';
import buildClassName from '../../../util/buildClassName';
import { REM } from '../../common/helpers/mediaDimensions';
import useDynamicColorListener from '../../../hooks/stickers/useDynamicColorListener';
import StickerView from '../../common/StickerView';
import styles from './ResaleGiftMenuAttributeSticker.module.scss';
const ATTRIBUTE_STICKER_SIZE = 1.5 * REM;
const ResaleGiftMenuAttributeSticker = ({ className, type, sticker, observeIntersectionForLoading, observeIntersectionForPlaying, theme, }) => {
    const stickerRef = useRef();
    const customColor = useDynamicColorListener(stickerRef, undefined, type !== 'pattern');
    return (<div ref={stickerRef} className={buildClassName(styles.root, className)} style={`width: ${ATTRIBUTE_STICKER_SIZE}px; height: ${ATTRIBUTE_STICKER_SIZE}px`}>
      <StickerView containerRef={stickerRef} sticker={sticker} size={ATTRIBUTE_STICKER_SIZE} shouldPreloadPreview observeIntersectionForLoading={observeIntersectionForLoading} observeIntersectionForPlaying={observeIntersectionForPlaying} thumbClassName={styles.thumb} customColor={customColor}/>
    </div>);
};
export default memo(withGlobal((global) => {
    return {
        theme: selectTheme(global),
    };
})(ResaleGiftMenuAttributeSticker));
