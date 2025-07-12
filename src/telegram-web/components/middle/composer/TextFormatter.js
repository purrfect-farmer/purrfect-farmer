import { memo, useEffect, useRef, useState, } from '../../../lib/teact/teact';
import { ApiMessageEntityTypes } from '../../../api/types';
import { EDITABLE_INPUT_ID } from '../../../config';
import { ensureProtocol } from '../../../util/browser/url';
import buildClassName from '../../../util/buildClassName';
import captureEscKeyListener from '../../../util/captureEscKeyListener';
import getKeyFromEvent from '../../../util/getKeyFromEvent';
import stopEvent from '../../../util/stopEvent';
import { INPUT_CUSTOM_EMOJI_SELECTOR } from './helpers/customEmoji';
import useFlag from '../../../hooks/useFlag';
import useLastCallback from '../../../hooks/useLastCallback';
import useOldLang from '../../../hooks/useOldLang';
import useShowTransitionDeprecated from '../../../hooks/useShowTransitionDeprecated';
import useVirtualBackdrop from '../../../hooks/useVirtualBackdrop';
import Icon from '../../common/icons/Icon';
import Button from '../../ui/Button';
import './TextFormatter.scss';
const TEXT_FORMAT_BY_TAG_NAME = {
    B: 'bold',
    STRONG: 'bold',
    I: 'italic',
    EM: 'italic',
    U: 'underline',
    DEL: 'strikethrough',
    CODE: 'monospace',
    SPAN: 'spoiler',
};
const fragmentEl = document.createElement('div');
const TextFormatter = ({ isOpen, anchorPosition, selectedRange, setSelectedRange, onClose, }) => {
    const containerRef = useRef();
    const linkUrlInputRef = useRef();
    const { shouldRender, transitionClassNames } = useShowTransitionDeprecated(isOpen);
    const [isLinkControlOpen, openLinkControl, closeLinkControl] = useFlag();
    const [linkUrl, setLinkUrl] = useState('');
    const [isEditingLink, setIsEditingLink] = useState(false);
    const [inputClassName, setInputClassName] = useState();
    const [selectedTextFormats, setSelectedTextFormats] = useState({});
    useEffect(() => (isOpen ? captureEscKeyListener(onClose) : undefined), [isOpen, onClose]);
    useVirtualBackdrop(isOpen, containerRef, onClose, true);
    useEffect(() => {
        if (isLinkControlOpen) {
            linkUrlInputRef.current.focus();
        }
        else {
            setLinkUrl('');
            setIsEditingLink(false);
        }
    }, [isLinkControlOpen]);
    useEffect(() => {
        if (!shouldRender) {
            closeLinkControl();
            setSelectedTextFormats({});
            setInputClassName(undefined);
        }
    }, [closeLinkControl, shouldRender]);
    useEffect(() => {
        if (!isOpen || !selectedRange) {
            return;
        }
        const selectedFormats = {};
        let { parentElement } = selectedRange.commonAncestorContainer;
        while (parentElement && parentElement.id !== EDITABLE_INPUT_ID) {
            const textFormat = TEXT_FORMAT_BY_TAG_NAME[parentElement.tagName];
            if (textFormat) {
                selectedFormats[textFormat] = true;
            }
            parentElement = parentElement.parentElement;
        }
        setSelectedTextFormats(selectedFormats);
    }, [isOpen, selectedRange, openLinkControl]);
    const restoreSelection = useLastCallback(() => {
        if (!selectedRange) {
            return;
        }
        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(selectedRange);
        }
    });
    const updateSelectedRange = useLastCallback(() => {
        const selection = window.getSelection();
        if (selection) {
            setSelectedRange(selection.getRangeAt(0));
        }
    });
    const getSelectedText = useLastCallback((shouldDropCustomEmoji) => {
        if (!selectedRange) {
            return undefined;
        }
        fragmentEl.replaceChildren(selectedRange.cloneContents());
        if (shouldDropCustomEmoji) {
            fragmentEl.querySelectorAll(INPUT_CUSTOM_EMOJI_SELECTOR).forEach((el) => {
                el.replaceWith(el.getAttribute('alt'));
            });
        }
        return fragmentEl.innerHTML;
    });
    const getSelectedElement = useLastCallback(() => {
        if (!selectedRange) {
            return undefined;
        }
        return selectedRange.commonAncestorContainer.parentElement;
    });
    function updateInputStyles() {
        const input = linkUrlInputRef.current;
        if (!input) {
            return;
        }
        const { offsetWidth, scrollWidth, scrollLeft } = input;
        if (scrollWidth <= offsetWidth) {
            setInputClassName(undefined);
            return;
        }
        let className = '';
        if (scrollLeft < scrollWidth - offsetWidth) {
            className = 'mask-right';
        }
        if (scrollLeft > 0) {
            className += ' mask-left';
        }
        setInputClassName(className);
    }
    function handleLinkUrlChange(e) {
        setLinkUrl(e.target.value);
        updateInputStyles();
    }
    function getFormatButtonClassName(key) {
        if (selectedTextFormats[key]) {
            return 'active';
        }
        if (key === 'monospace' || key === 'strikethrough') {
            if (Object.keys(selectedTextFormats).some((fKey) => fKey !== key && Boolean(selectedTextFormats[fKey]))) {
                return 'disabled';
            }
        }
        else if (selectedTextFormats.monospace || selectedTextFormats.strikethrough) {
            return 'disabled';
        }
        return undefined;
    }
    const handleSpoilerText = useLastCallback(() => {
        if (selectedTextFormats.spoiler) {
            const element = getSelectedElement();
            if (!selectedRange
                || !element
                || element.dataset.entityType !== ApiMessageEntityTypes.Spoiler
                || !element.textContent) {
                return;
            }
            element.replaceWith(element.textContent);
            setSelectedTextFormats((selectedFormats) => ({
                ...selectedFormats,
                spoiler: false,
            }));
            return;
        }
        const text = getSelectedText();
        document.execCommand('insertHTML', false, `<span class="spoiler" data-entity-type="${ApiMessageEntityTypes.Spoiler}">${text}</span>`);
        onClose();
    });
    const handleBoldText = useLastCallback(() => {
        setSelectedTextFormats((selectedFormats) => {
            // Somehow re-applying 'bold' command to already bold text doesn't work
            document.execCommand(selectedFormats.bold ? 'removeFormat' : 'bold');
            Object.keys(selectedFormats).forEach((key) => {
                if ((key === 'italic' || key === 'underline') && Boolean(selectedFormats[key])) {
                    document.execCommand(key);
                }
            });
            updateSelectedRange();
            return {
                ...selectedFormats,
                bold: !selectedFormats.bold,
            };
        });
    });
    const handleItalicText = useLastCallback(() => {
        document.execCommand('italic');
        updateSelectedRange();
        setSelectedTextFormats((selectedFormats) => ({
            ...selectedFormats,
            italic: !selectedFormats.italic,
        }));
    });
    const handleUnderlineText = useLastCallback(() => {
        document.execCommand('underline');
        updateSelectedRange();
        setSelectedTextFormats((selectedFormats) => ({
            ...selectedFormats,
            underline: !selectedFormats.underline,
        }));
    });
    const handleStrikethroughText = useLastCallback(() => {
        if (selectedTextFormats.strikethrough) {
            const element = getSelectedElement();
            if (!selectedRange
                || !element
                || element.tagName !== 'DEL'
                || !element.textContent) {
                return;
            }
            element.replaceWith(element.textContent);
            setSelectedTextFormats((selectedFormats) => ({
                ...selectedFormats,
                strikethrough: false,
            }));
            return;
        }
        const text = getSelectedText();
        document.execCommand('insertHTML', false, `<del>${text}</del>`);
        onClose();
    });
    const handleMonospaceText = useLastCallback(() => {
        if (selectedTextFormats.monospace) {
            const element = getSelectedElement();
            if (!selectedRange
                || !element
                || element.tagName !== 'CODE'
                || !element.textContent) {
                return;
            }
            element.replaceWith(element.textContent);
            setSelectedTextFormats((selectedFormats) => ({
                ...selectedFormats,
                monospace: false,
            }));
            return;
        }
        const text = getSelectedText(true);
        document.execCommand('insertHTML', false, `<code class="text-entity-code" dir="auto">${text}</code>`);
        onClose();
    });
    const handleLinkUrlConfirm = useLastCallback(() => {
        const formattedLinkUrl = (ensureProtocol(linkUrl) || '').split('%').map(encodeURI).join('%');
        if (isEditingLink) {
            const element = getSelectedElement();
            if (!element || element.tagName !== 'A') {
                return;
            }
            element.href = formattedLinkUrl;
            onClose();
            return;
        }
        const text = getSelectedText(true);
        restoreSelection();
        document.execCommand('insertHTML', false, `<a href=${formattedLinkUrl} class="text-entity-link" dir="auto">${text}</a>`);
        onClose();
    });
    const handleKeyDown = useLastCallback((e) => {
        const HANDLERS_BY_KEY = {
            k: openLinkControl,
            b: handleBoldText,
            u: handleUnderlineText,
            i: handleItalicText,
            m: handleMonospaceText,
            s: handleStrikethroughText,
            p: handleSpoilerText,
        };
        const handler = HANDLERS_BY_KEY[getKeyFromEvent(e)];
        if (e.altKey
            || !(e.ctrlKey || e.metaKey)
            || !handler) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        handler();
    });
    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleKeyDown]);
    const lang = useOldLang();
    function handleContainerKeyDown(e) {
        if (e.key === 'Enter' && isLinkControlOpen) {
            handleLinkUrlConfirm();
            e.preventDefault();
        }
    }
    if (!shouldRender) {
        return undefined;
    }
    const className = buildClassName('TextFormatter', transitionClassNames, isLinkControlOpen && 'link-control-shown');
    const linkUrlConfirmClassName = buildClassName('TextFormatter-link-url-confirm', Boolean(linkUrl.length) && 'shown');
    const style = anchorPosition
        ? `left: ${anchorPosition.x}px; top: ${anchorPosition.y}px;--text-formatter-left: ${anchorPosition.x}px;`
        : '';
    return (<div ref={containerRef} className={className} style={style} onKeyDown={handleContainerKeyDown} 
    // Prevents focus loss when clicking on the toolbar
    onMouseDown={stopEvent}>
      <div className="TextFormatter-buttons">
        <Button color="translucent" ariaLabel="Spoiler text" className={getFormatButtonClassName('spoiler')} onClick={handleSpoilerText}>
          <Icon name="eye-crossed"/>
        </Button>
        <div className="TextFormatter-divider"/>
        <Button color="translucent" ariaLabel="Bold text" className={getFormatButtonClassName('bold')} onClick={handleBoldText}>
          <Icon name="bold"/>
        </Button>
        <Button color="translucent" ariaLabel="Italic text" className={getFormatButtonClassName('italic')} onClick={handleItalicText}>
          <Icon name="italic"/>
        </Button>
        <Button color="translucent" ariaLabel="Underlined text" className={getFormatButtonClassName('underline')} onClick={handleUnderlineText}>
          <Icon name="underlined"/>
        </Button>
        <Button color="translucent" ariaLabel="Strikethrough text" className={getFormatButtonClassName('strikethrough')} onClick={handleStrikethroughText}>
          <Icon name="strikethrough"/>
        </Button>
        <Button color="translucent" ariaLabel="Monospace text" className={getFormatButtonClassName('monospace')} onClick={handleMonospaceText}>
          <Icon name="monospace"/>
        </Button>
        <div className="TextFormatter-divider"/>
        <Button color="translucent" ariaLabel={lang('TextFormat.AddLinkTitle')} onClick={openLinkControl}>
          <Icon name="link"/>
        </Button>
      </div>

      <div className="TextFormatter-link-control">
        <div className="TextFormatter-buttons">
          <Button color="translucent" ariaLabel={lang('Cancel')} onClick={closeLinkControl}>
            <Icon name="arrow-left"/>
          </Button>
          <div className="TextFormatter-divider"/>

          <div className={buildClassName('TextFormatter-link-url-input-wrapper', inputClassName)}>
            <input ref={linkUrlInputRef} className="TextFormatter-link-url-input" type="text" value={linkUrl} placeholder="Enter URL..." autoComplete="off" inputMode="url" dir="auto" onChange={handleLinkUrlChange} onScroll={updateInputStyles}/>
          </div>

          <div className={linkUrlConfirmClassName}>
            <div className="TextFormatter-divider"/>
            <Button color="translucent" ariaLabel={lang('Save')} className="color-primary" onClick={handleLinkUrlConfirm}>
              <Icon name="check"/>
            </Button>
          </div>
        </div>
      </div>
    </div>);
};
export default memo(TextFormatter);
