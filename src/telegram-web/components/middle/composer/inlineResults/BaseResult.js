import { memo } from '../../../../lib/teact/teact';
import { getWebDocumentHash } from '../../../../global/helpers';
import { getFirstLetters } from '../../../../util/textFormat';
import renderText from '../../../common/helpers/renderText';
import { preventMessageInputBlurWithBubbling } from '../../helpers/preventMessageInputBlur';
import useMedia from '../../../../hooks/useMedia';
import ListItem from '../../../ui/ListItem';
import './BaseResult.scss';
const BaseResult = ({ title, description, thumbnail, thumbUrl, focus, transitionClassNames = '', onClick, }) => {
    let content;
    const thumbnailDataUrl = useMedia(thumbnail ? getWebDocumentHash(thumbnail) : undefined);
    thumbUrl = thumbUrl || thumbnailDataUrl;
    if (thumbUrl) {
        content = (<img src={thumbUrl} className={transitionClassNames} alt="" decoding="async" draggable={false}/>);
    }
    else if (title) {
        content = getFirstLetters(title, 1);
    }
    return (<ListItem focus={focus} className="BaseResult chat-item-clickable" onMouseDown={preventMessageInputBlurWithBubbling} onClick={onClick}>
      <span className="thumb">
        {typeof content === 'string' ? renderText(content) : content}
      </span>
      <div className="content-inner">
        {title && (<div className="title">{title}</div>)}
        {description && (<div className="description">{description}</div>)}
      </div>
    </ListItem>);
};
export default memo(BaseResult);
