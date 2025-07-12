import buildClassName from '../../util/buildClassName';
import renderText from './helpers/renderText';
import useOldLang from '../../hooks/useOldLang';
import './DotAnimation.scss';
const DotAnimation = ({ content, className }) => {
    const lang = useOldLang();
    return (<span className={buildClassName('DotAnimation', className)} dir={lang.isRtl ? 'rtl' : 'auto'}>
      {renderText(content)}
      <span className="ellipsis"/>
    </span>);
};
export default DotAnimation;
