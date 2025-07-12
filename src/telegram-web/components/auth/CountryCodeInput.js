import { memo, useCallback, useRef, useState, } from '../../lib/teact/teact';
import { withGlobal } from '../../global';
import { ANIMATION_END_DELAY } from '../../config';
import { IS_EMOJI_SUPPORTED } from '../../util/browser/windowEnvironment';
import buildClassName from '../../util/buildClassName';
import { isoToEmoji } from '../../util/emoji/emoji';
import { prepareSearchWordsForNeedle } from '../../util/searchWords';
import renderText from '../common/helpers/renderText';
import useLang from '../../hooks/useLang';
import useSyncEffect from '../../hooks/useSyncEffect';
import DropdownMenu from '../ui/DropdownMenu';
import MenuItem from '../ui/MenuItem';
import Spinner from '../ui/Spinner';
import './CountryCodeInput.scss';
const MENU_HIDING_DURATION = 200 + ANIMATION_END_DELAY;
const SELECT_TIMEOUT = 50;
const CountryCodeInput = ({ id, value, isLoading, onChange, phoneCodeList, }) => {
    const lang = useLang();
    const inputRef = useRef();
    const [filter, setFilter] = useState();
    const [filteredList, setFilteredList] = useState([]);
    const updateFilter = useCallback((filterValue) => {
        setFilter(filterValue);
        setFilteredList(getFilteredList(phoneCodeList, filterValue));
    }, [phoneCodeList]);
    useSyncEffect(([prevPhoneCodeList]) => {
        if (!prevPhoneCodeList?.length && phoneCodeList.length) {
            setFilteredList(getFilteredList(phoneCodeList, filter));
        }
    }, [phoneCodeList, filter]);
    const handleChange = useCallback((country) => {
        onChange(country);
        setTimeout(() => updateFilter(undefined), MENU_HIDING_DURATION);
    }, [onChange, updateFilter]);
    const handleInput = useCallback((e) => {
        updateFilter(e.currentTarget.value);
    }, [updateFilter]);
    const handleInputKeyDown = useCallback((e) => {
        if (e.keyCode !== 8) {
            return;
        }
        const target = e.currentTarget;
        if (value && filter === undefined) {
            target.value = '';
        }
        updateFilter(target.value);
    }, [filter, updateFilter, value]);
    const CodeInput = useCallback(({ onTrigger, isOpen }) => {
        const handleTrigger = () => {
            if (isOpen) {
                return;
            }
            setTimeout(() => {
                inputRef.current.select();
            }, SELECT_TIMEOUT);
            onTrigger();
            const formEl = document.getElementById('auth-phone-number-form');
            formEl.scrollTo({ top: formEl.scrollHeight, behavior: 'smooth' });
        };
        const handleCodeInput = (e) => {
            handleInput(e);
            handleTrigger();
        };
        const emoji = value && IS_EMOJI_SUPPORTED && isoToEmoji(value.iso2);
        const name = value?.name || value?.defaultName || '';
        const inputValue = filter ?? [emoji, name].filter(Boolean).join(' ');
        return (<div className={buildClassName('input-group', value && 'touched')}>
        <input ref={inputRef} className={buildClassName('form-control', isOpen && 'focus')} type="text" id={id} value={inputValue} autoComplete="off" onClick={handleTrigger} onFocus={handleTrigger} onInput={handleCodeInput} onKeyDown={handleInputKeyDown}/>
        <label>{lang('LoginSelectCountryTitle')}</label>
        {isLoading ? (<Spinner color="black"/>) : (<i onClick={handleTrigger} className={buildClassName('css-icon-down', isOpen && 'open')}/>)}
      </div>);
    }, [filter, handleInput, handleInputKeyDown, id, isLoading, lang, value]);
    return (<DropdownMenu className="CountryCodeInput" trigger={CodeInput}>
      {filteredList
            .map((country) => (<MenuItem key={`${country.iso2}-${country.countryCode}`} className={value && country.iso2 === value.iso2 ? 'selected' : ''} onClick={() => handleChange(country)}>
            <span className="country-flag">{renderText(isoToEmoji(country.iso2), ['hq_emoji'])}</span>
            <span className="country-name">{country.name || country.defaultName}</span>
            <span className="country-code">
              +
              {country.countryCode}
            </span>
          </MenuItem>))}
      {!filteredList.length && (<MenuItem key="no-results" className="no-results" disabled>
          <span>{lang('CountryNone')}</span>
        </MenuItem>)}
    </DropdownMenu>);
};
function getFilteredList(countryList, filter = '') {
    if (!filter.length) {
        return countryList;
    }
    const searchWords = prepareSearchWordsForNeedle(filter);
    return countryList.filter((country) => (searchWords(country.defaultName) || (country.name && searchWords(country.name))));
}
export default memo(withGlobal((global) => {
    const { countryList: { phoneCodes: phoneCodeList } } = global;
    return {
        phoneCodeList,
    };
})(CountryCodeInput));
