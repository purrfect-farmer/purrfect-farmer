import { memo } from '../../../lib/teact/teact';
import { getActions } from '../../../global';
import useLastCallback from '../../../hooks/useLastCallback';
import useOldLang from '../../../hooks/useOldLang';
import StarIcon from '../../common/icons/StarIcon';
import ListItem from '../../ui/ListItem';
function PremiumStatusItem({ premiumSection }) {
    const { openPremiumModal } = getActions();
    const lang = useOldLang();
    const handleOpenPremiumModal = useLastCallback(() => openPremiumModal({ initialSection: premiumSection }));
    return (<div className="settings-item">
      <ListItem leftElement={<StarIcon className="icon ListItem-main-icon" type="premium" size="big"/>} onClick={handleOpenPremiumModal}>
        {lang('PrivacyLastSeenPremium')}
      </ListItem>
      <p className="settings-item-description-larger premium-info" dir={lang.isRtl ? 'rtl' : undefined}>
        {lang('lng_messages_privacy_premium_about')}
      </p>
    </div>);
}
export default memo(PremiumStatusItem);
