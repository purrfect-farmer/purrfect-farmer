import { memo } from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';
import { selectIsCurrentUserPremium, selectShouldHideReadMarks } from '../../../global/selectors';
import renderText from '../../common/helpers/renderText';
import useLastCallback from '../../../hooks/useLastCallback';
import useOldLang from '../../../hooks/useOldLang';
import StarIcon from '../../common/icons/StarIcon';
import Checkbox from '../../ui/Checkbox';
import ListItem from '../../ui/ListItem';
const SettingsPrivacyLastSeen = ({ isCurrentUserPremium, shouldHideReadMarks, visibility, }) => {
    const { updateGlobalPrivacySettings, openPremiumModal } = getActions();
    const lang = useOldLang();
    const canShowHideReadTime = visibility === 'nobody' || visibility === 'contacts';
    const handleChangeShouldHideReadMarks = useLastCallback((isEnabled) => updateGlobalPrivacySettings({ shouldHideReadMarks: isEnabled }));
    const handleOpenPremiumModal = useLastCallback(() => {
        openPremiumModal({
            initialSection: 'last_seen',
        });
    });
    return (<>
      {canShowHideReadTime && (<div className="settings-item">
          <Checkbox label={lang('HideReadTime')} checked={shouldHideReadMarks} onCheck={handleChangeShouldHideReadMarks}/>
          <p className="settings-item-description-larger" dir={lang.isRtl ? 'rtl' : undefined}>
            {renderText(lang('HideReadTimeInfo'), ['br'])}
          </p>
        </div>)}
      <div className="settings-item">
        <ListItem leftElement={<StarIcon className="icon ListItem-main-icon" type="premium" size="big"/>} onClick={handleOpenPremiumModal}>
          {isCurrentUserPremium ? lang('PrivacyLastSeenPremiumForPremium') : lang('PrivacyLastSeenPremium')}
        </ListItem>
        <p className="settings-item-description-larger premium-info" dir={lang.isRtl ? 'rtl' : undefined}>
          {isCurrentUserPremium
            ? lang('PrivacyLastSeenPremiumInfoForPremium')
            : lang('PrivacyLastSeenPremiumInfo')}
        </p>
      </div>
    </>);
};
export default memo(withGlobal((global) => {
    return {
        isCurrentUserPremium: selectIsCurrentUserPremium(global),
        shouldHideReadMarks: Boolean(selectShouldHideReadMarks(global)),
    };
})(SettingsPrivacyLastSeen));
