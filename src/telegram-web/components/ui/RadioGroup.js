import { memo, useCallback } from '../../lib/teact/teact';
import buildClassName from '../../util/buildClassName';
import useLastCallback from '../../hooks/useLastCallback';
import Radio from './Radio';
const RadioGroup = ({ id, name, options, selected, disabled, loadingOption, onChange, onClickAction, subLabelClassName, isLink, withIcon, subLabel, className, }) => {
    const handleChange = useCallback((event) => {
        const { value } = event.currentTarget;
        onChange(value, event);
    }, [onChange]);
    const onSubLabelClick = useLastCallback((value) => () => {
        onClickAction?.(value);
    });
    return (<div id={id} className={buildClassName('radio-group', className)}>
      {options.map((option) => (<Radio name={name} label={option.label} subLabel={subLabel || option.subLabel} subLabelClassName={subLabelClassName} value={option.value} checked={option.value === selected} hidden={option.hidden} isCanCheckedInDisabled={option.isCanCheckedInDisabled} disabled={disabled} withIcon={withIcon} isLoading={loadingOption ? loadingOption === option.value : undefined} className={option.className} onChange={handleChange} onSubLabelClick={onSubLabelClick(option.value)} isLink={isLink}/>))}
    </div>);
};
export default memo(RadioGroup);
