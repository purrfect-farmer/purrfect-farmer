import { memo, useCallback } from '../../lib/teact/teact';
import buildClassName from '../../util/buildClassName';
import './Switcher.scss';
const Switcher = ({ id, name, value, label, checked = false, disabled, inactive, noAnimation, onChange, onCheck, }) => {
    const handleChange = useCallback((e) => {
        if (onChange) {
            onChange(e);
        }
        if (onCheck) {
            onCheck(e.currentTarget.checked);
        }
    }, [onChange, onCheck]);
    const className = buildClassName('Switcher', disabled && 'disabled', inactive && 'inactive', noAnimation && 'no-animation');
    return (<label className={className} title={label}>
      <input type="checkbox" id={id} name={name} value={value} checked={checked} disabled={disabled} onChange={handleChange}/>
      <span className="widget"/>
    </label>);
};
export default memo(Switcher);
