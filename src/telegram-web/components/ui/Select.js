import { memo } from '../../lib/teact/teact';
import buildClassName from '../../util/buildClassName';
const Select = (props) => {
    const { id, value, label, hasArrow, error, ref, tabIndex, onChange, children, } = props;
    const labelText = error || label;
    const fullClassName = buildClassName('input-group', value && 'touched', error && 'error', labelText && 'with-label', hasArrow && 'with-arrow', 'input-group');
    return (<div className={fullClassName}>
      <select className="form-control" id={id} value={value || ''} onChange={onChange} tabIndex={tabIndex} ref={ref}>
        {children}
      </select>
      {labelText && id && (<label htmlFor={id}>{labelText}</label>)}
    </div>);
};
export default memo(Select);
