import { memo, useMemo, useRef, useState, } from '../../../lib/teact/teact';
import { withGlobal } from '../../../global';
import buildClassName from '../../../util/buildClassName';
import useHorizontalScroll from '../../../hooks/useHorizontalScroll';
import useLang from '../../../hooks/useLang';
import StarIcon from '../../common/icons/StarIcon';
import styles from './StarGiftCategoryList.module.scss';
const StarGiftCategoryList = ({ idsByCategory, onCategoryChanged, areLimitedStarGiftsDisallowed, }) => {
    const ref = useRef();
    const lang = useLang();
    const starCategories = useMemo(() => idsByCategory && Object.keys(idsByCategory)
        .filter((category) => category !== 'all' && category !== 'limited')
        .map(Number)
        .sort((a, b) => a - b), [idsByCategory]);
    const hasResale = idsByCategory && idsByCategory['resale'].length > 0;
    const [selectedCategory, setSelectedCategory] = useState('all');
    function handleItemClick(category) {
        setSelectedCategory(category);
        onCategoryChanged(category);
    }
    function renderCategoryName(category) {
        if (category === 'all')
            return lang('AllGiftsCategory');
        if (category === 'stock')
            return lang('StockGiftsCategory');
        if (category === 'limited')
            return lang('LimitedGiftsCategory');
        if (category === 'resale')
            return lang('GiftCategoryResale');
        return category;
    }
    function renderCategoryItem(category) {
        return (<div className={buildClassName(styles.item, selectedCategory === category && styles.selectedItem)} onClick={() => handleItemClick(category)}>
        {Number.isInteger(category) && (<StarIcon className={styles.star} type="gold" size="middle"/>)}
        {renderCategoryName(category)}
      </div>);
    }
    useHorizontalScroll(ref, undefined, true);
    return (<div ref={ref} className={buildClassName(styles.list, 'no-scrollbar')}>
      {renderCategoryItem('all')}
      {!areLimitedStarGiftsDisallowed && renderCategoryItem('limited')}
      {!areLimitedStarGiftsDisallowed && hasResale && renderCategoryItem('resale')}
      {renderCategoryItem('stock')}
      {starCategories?.map(renderCategoryItem)}
    </div>);
};
export default memo(withGlobal((global) => {
    const { starGifts } = global;
    return {
        idsByCategory: starGifts?.idsByCategory,
    };
})(StarGiftCategoryList));
