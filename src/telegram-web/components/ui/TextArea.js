import { memo, useCallback, useLayoutEffect, useRef, } from '../../lib/teact/teact';
import { requestForcedReflow, requestMutation } from '../../lib/fasterdom/fasterdom';
import buildClassName from '../../util/buildClassName';
import useLastCallback from '../../hooks/useLastCallback';
import useOldLang from '../../hooks/useOldLang';
const TextArea = ({ ref, id, className, value, label, error, success, disabled, readOnly, placeholder, autoComplete, inputMode, maxLength, maxLengthIndicator, tabIndex, onChange, onInput, onKeyPress, onKeyDown, onBlur, onPaste, noReplaceNewlines, }) => {
    let textareaRef = useRef();
    if (ref) {
        textareaRef = ref;
    }
    const lang = useOldLang();
    const labelText = error || success || label;
    const fullClassName = buildClassName('input-group', value && 'touched', error ? 'error' : success && 'success', disabled && 'disabled', readOnly && 'disabled', labelText && 'with-label', className);
    const resizeHeight = useLastCallback((element) => {
        requestMutation(() => {
            element.style.height = '0';
            requestForcedReflow(() => {
                const newHeight = element.scrollHeight;
                return () => {
                    element.style.height = `${newHeight}px`;
                };
            });
        });
    });
    useLayoutEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea)
            return;
        resizeHeight(textarea);
    }, []);
    const handleChange = useCallback((e) => {
        const target = e.currentTarget;
        if (!noReplaceNewlines) {
            const previousSelectionEnd = target.selectionEnd;
            // TDesktop replaces newlines with spaces as well
            target.value = target.value.replace(/\n/g, ' ');
            target.selectionEnd = previousSelectionEnd;
        }
        resizeHeight(target);
        onChange?.(e);
    }, [noReplaceNewlines, onChange]);
    return (<div className={fullClassName} dir={lang.isRtl ? 'rtl' : undefined}>
      <textarea ref={textareaRef} className="form-control" id={id} dir="auto" value={value || ''} tabIndex={tabIndex} placeholder={placeholder} maxLength={maxLength} autoComplete={autoComplete} inputMode={inputMode} disabled={disabled} readOnly={readOnly} onChange={handleChange} onInput={onInput} onKeyPress={onKeyPress} onKeyDown={onKeyDown} onBlur={onBlur} onPaste={onPaste} aria-label={labelText}/>
      {labelText && (<label htmlFor={id}>{labelText}</label>)}
      {maxLengthIndicator && (<div className="max-length-indicator">{maxLengthIndicator}</div>)}
    </div>);
};
export default memo(TextArea);
