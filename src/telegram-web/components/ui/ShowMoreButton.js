import useOldLang from '../../hooks/useOldLang';
import Icon from '../common/icons/Icon';
import Button from './Button';
import './ShowMoreButton.scss';
const ShowMoreButton = ({ count, itemName, itemPluralName, isLoading, onClick, }) => {
    const lang = useOldLang();
    return (<Button className="ShowMoreButton" color="translucent" size="smaller" isText isLoading={isLoading} isRtl={lang.isRtl} onClick={onClick}>
      <Icon name="down"/>
      Show
      {' '}
      {count}
      {' '}
      more
      {' '}
      {count > 1 ? itemPluralName || `${itemName}s` : itemName}
    </Button>);
};
export default ShowMoreButton;
