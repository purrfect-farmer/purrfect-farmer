import { memo, useMemo, useState, } from '../../lib/teact/teact';
import { getActions } from '../../global';
import buildClassName from '../../util/buildClassName';
import useLastCallback from '../../hooks/useLastCallback';
import useOldLang from '../../hooks/useOldLang';
import usePreviousDeprecated from '../../hooks/usePreviousDeprecated';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Icon from './icons/Icon';
import ItemPicker from './pickers/ItemPicker';
import styles from './CountryPickerModal.module.scss';
const CountryPickerModal = ({ isOpen, onClose, onSubmit, countryList, selectionLimit, }) => {
    const { showNotification } = getActions();
    const lang = useOldLang();
    const [selectedCountryIds, setSelectedCountryIds] = useState([]);
    const prevSelectedCountryIds = usePreviousDeprecated(selectedCountryIds);
    const noPickerScrollRestore = prevSelectedCountryIds === selectedCountryIds;
    const displayedIds = useMemo(() => {
        if (!countryList) {
            return [];
        }
        return countryList.filter((country) => !country.isHidden && country.iso2 !== 'FT')
            .map(({ iso2, defaultName, }) => ({
            value: iso2,
            label: defaultName,
        }));
    }, [countryList]);
    const handleSelectedIdsChange = useLastCallback((newSelectedIds) => {
        if (selectionLimit && newSelectedIds.length > selectionLimit) {
            showNotification({
                message: lang('BoostingSelectUpToWarningCountries', selectionLimit),
            });
            return;
        }
        setSelectedCountryIds(newSelectedIds);
    });
    const handleSubmit = useLastCallback(() => {
        onSubmit(selectedCountryIds);
        onClose();
    });
    return (<Modal className={styles.root} isOpen={isOpen} onClose={onClose} onEnter={handleSubmit}>
      <div className={styles.container}>
        <div className={styles.pickerSelector}>
          <Button round size="smaller" color="translucent" onClick={onClose}>
            <Icon name="close"/>
          </Button>

          <h4 className={styles.pickerTitle}>
            {lang('BoostingSelectCountry')}
          </h4>
        </div>
      </div>

      <div className={buildClassName(styles.main, 'custom-scroll')}>
        <ItemPicker className={styles.picker} items={displayedIds} selectedValues={selectedCountryIds} onSelectedValuesChange={handleSelectedIdsChange} noScrollRestore={noPickerScrollRestore} allowMultiple itemInputType="checkbox"/>
      </div>

      <div className={styles.footer}>
        <Button size="smaller" onClick={handleSubmit}>
          {lang('SelectCountries.OK')}
        </Button>
      </div>
    </Modal>);
};
export default memo(CountryPickerModal);
