import { memo } from '../../lib/teact/teact';
import buildClassName from '../../util/buildClassName';
import useOldLang from '../../hooks/useOldLang';
const InputText = ({ ref, id, className, value, label, error, success, disabled, readOnly, placeholder, autoComplete, inputMode, maxLength, tabIndex, teactExperimentControlled, onChange, onInput, onKeyPress, onKeyDown, onBlur, onPaste, }) => {
    const lang = useOldLang();
    const labelText = error || success || label;
    const fullClassName = buildClassName('input-group', value && 'touched', error ? 'error' : success && 'success', disabled && 'disabled', readOnly && 'disabled', labelText && 'with-label', className);
    return (<div className={fullClassName} dir={lang.isRtl ? 'rtl' : undefined}>
      <input ref={ref} className="form-control" type="text" id={id} dir="auto" value={value || ''} tabIndex={tabIndex} placeholder={placeholder} maxLength={maxLength} autoComplete={autoComplete} inputMode={inputMode} disabled={disabled} readOnly={readOnly} onChange={onChange} onInput={onInput} onKeyPress={onKeyPress} onKeyDown={onKeyDown} onBlur={onBlur} onPaste={onPaste} aria-label={labelText} teactExperimentControlled={teactExperimentControlled}/>
      {labelText && (<label htmlFor={id}>{labelText}</label>)}
    </div>);
};
export default memo(InputText);
