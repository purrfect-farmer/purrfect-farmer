import { memo, useRef } from '../../../lib/teact/teact';
import { getGiftAttributes } from '../../common/helpers/gifts';
import RadialPatternBackground from '../../common/profile/RadialPatternBackground';
import StickerView from '../../common/StickerView';
import styles from './WebPageUniqueGift.module.scss';
const STAR_GIFT_STICKER_SIZE = 120;
const WebPageUniqueGift = ({ gift, observeIntersectionForLoading, observeIntersectionForPlaying, onClick, }) => {
    const stickerRef = useRef();
    const { backdrop, model, pattern, } = getGiftAttributes(gift);
    const backgroundColors = [backdrop.centerColor, backdrop.edgeColor];
    return (<div className={styles.root} onClick={onClick}>
      <div className={styles.backgroundWrapper}>
        <RadialPatternBackground className={styles.background} backgroundColors={backgroundColors} patternColor={backdrop.patternColor} patternIcon={pattern.sticker}/>
      </div>
      <div ref={stickerRef} className={styles.stickerWrapper}>
        <StickerView containerRef={stickerRef} sticker={model.sticker} size={STAR_GIFT_STICKER_SIZE} observeIntersectionForPlaying={observeIntersectionForPlaying} observeIntersectionForLoading={observeIntersectionForLoading}/>
      </div>
    </div>);
};
export default memo(WebPageUniqueGift);
