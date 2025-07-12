import { memo, useRef, useState, } from '../../lib/teact/teact';
import buildClassName from '../../util/buildClassName';
import { REM } from '../common/helpers/mediaDimensions';
import renderText from '../common/helpers/renderText';
import useCurrentOrPrev from '../../hooks/useCurrentOrPrev';
import useLastCallback from '../../hooks/useLastCallback';
import useOldLang from '../../hooks/useOldLang';
import Avatar from '../common/Avatar';
import Icon from '../common/icons/Icon';
import Button from './Button';
import Spinner from './Spinner';
import './Checkbox.scss';
const AVATAR_SIZE = 1.25 * REM;
const Checkbox = ({ id, name, value, label, user, labelText, subLabel, checked, tabIndex, disabled, withIcon, blocking, permissionGroup, isLoading, className, rightIcon, onlyInput, isRound, nestedCheckbox, nestedCheckboxCount, nestedOptionList, leftElement, values, onChange, onCheck, onClickLabel, }) => {
    const lang = useOldLang();
    const labelRef = useRef();
    const [showNested, setShowNested] = useState(false);
    const renderingUser = useCurrentOrPrev(user, true);
    const handleChange = useLastCallback((event) => {
        if (disabled) {
            return;
        }
        if (onChange) {
            onChange(event, nestedOptionList);
        }
        if (onCheck) {
            onCheck(event.currentTarget.checked);
        }
    });
    const toggleNested = useLastCallback(() => {
        setShowNested(!showNested);
    });
    function handleClick(event) {
        if (event.target !== labelRef.current) {
            onClickLabel?.(event, value);
        }
    }
    function handleInputClick(event) {
        event.stopPropagation();
    }
    const labelClassName = buildClassName('Checkbox', disabled && 'disabled', withIcon && 'withIcon', isLoading && 'loading', blocking && 'blocking', nestedCheckbox && 'nested', subLabel && 'withSubLabel', permissionGroup && 'permission-group', Boolean(leftElement) && 'avatar', onlyInput && 'onlyInput', isRound && 'round', Boolean(rightIcon) && 'withNestedList', className);
    return (<>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <label className={labelClassName} dir={lang.isRtl ? 'rtl' : undefined} onClick={onClickLabel ? handleClick : undefined} ref={labelRef}>
        <input type="checkbox" id={id} name={name} value={value} checked={checked} disabled={disabled} tabIndex={tabIndex} onChange={handleChange} onClick={onClickLabel ? handleInputClick : undefined}/>
        <div className={buildClassName('Checkbox-main', Boolean(leftElement) && 'Nested-avatar-list')}>
          <div className={buildClassName('user-avatar', renderingUser && 'user-avatar-visible')}>
            {renderingUser && (<Avatar peer={renderingUser} size={AVATAR_SIZE}/>)}
          </div>
          <span className="label" dir="auto">
            {leftElement}
            {typeof label === 'string' ? renderText(label) : label}
            {Boolean(labelText) && <span className="ml-1">{renderText(labelText)}</span>}
          </span>
          {subLabel && <span className="subLabel" dir="auto">{renderText(subLabel)}</span>}
          {rightIcon && <Icon name={rightIcon} className="right-icon"/>}
        </div>
        {nestedCheckbox && (<span className="nestedButton" dir="auto">
            <Button className="button" color="translucent" size="smaller" onClick={toggleNested}>
              <Icon name="group-filled" className="group-icon"/>
              {nestedCheckboxCount}
              <Icon name={showNested ? 'up' : 'down'}/>
            </Button>
          </span>)}
        {isLoading && <Spinner />}
      </label>
      {nestedCheckbox && (<div className={buildClassName('nested-checkbox-group', showNested && 'nested-checkbox-group-open')}>
          {nestedOptionList?.nestedOptions?.map((nestedOption) => (<Checkbox key={nestedOption.value} leftElement={leftElement} onChange={handleChange} checked={values?.indexOf(nestedOption.value) !== -1} values={values} {...nestedOption}/>))}
        </div>)}
    </>);
};
export default memo(Checkbox);
