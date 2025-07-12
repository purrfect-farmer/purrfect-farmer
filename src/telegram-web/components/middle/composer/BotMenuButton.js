import { memo, useEffect, useRef } from '../../../lib/teact/teact';
import buildClassName from '../../../util/buildClassName';
import renderText from '../../common/helpers/renderText';
import Icon from '../../common/icons/Icon';
import Button from '../../ui/Button';
const BotMenuButton = ({ isOpen, onClick, text, isDisabled, }) => {
    const textRef = useRef();
    useEffect(() => {
        const textEl = textRef.current;
        if (!textEl)
            return;
        const width = textEl.scrollWidth + 1; // Make width slightly bigger prevent ellipsis in some cases
        const composerEl = textEl.closest('.Composer');
        composerEl.style.setProperty('--bot-menu-text-width', `${width}px`);
    }, [isOpen, text]);
    useEffect(() => {
        const textEl = textRef.current;
        if (!textEl)
            return undefined;
        const composerEl = textEl.closest('.Composer');
        return () => {
            composerEl.style.removeProperty('--bot-menu-text-width');
        };
    }, []);
    return (<Button className={buildClassName('composer-action-button bot-menu', isOpen && 'open')} round color="translucent" disabled={isDisabled} onClick={onClick} ariaLabel="Open bot command keyboard">
      <Icon name="webapp" className={buildClassName('bot-menu-icon', isOpen && 'open')}/>
      <span ref={textRef} className="bot-menu-text">{renderText(text)}</span>
    </Button>);
};
export default memo(BotMenuButton);
