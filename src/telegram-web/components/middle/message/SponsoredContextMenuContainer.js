import { memo } from '../../../lib/teact/teact';
import { getActions } from '../../../global';
import useLastCallback from '../../../hooks/useLastCallback';
import useShowTransition from '../../../hooks/useShowTransition';
import SponsoredContextMenu from './SponsoredContextMenu';
const SponsoredMessageContextMenuContainer = ({ isOpen, randomId, sponsorInfo, additionalInfo, canReport, anchor, triggerRef, shouldSkipAbout, onItemClick, onClose, onCloseAnimationEnd, }) => {
    const { openAboutAdsModal, showDialog, reportSponsored, hideSponsored, } = getActions();
    const { ref } = useShowTransition({
        isOpen,
        onCloseAnimationEnd,
    });
    const handleItemClick = useLastCallback(() => {
        onItemClick?.();
        onClose();
    });
    const handleAboutAdsOpen = useLastCallback(() => {
        openAboutAdsModal({
            randomId,
            additionalInfo,
            canReport,
            sponsorInfo,
        });
        handleItemClick();
    });
    const handleSponsoredHide = useLastCallback(() => {
        hideSponsored();
        handleItemClick();
    });
    const handleSponsorInfo = useLastCallback(() => {
        showDialog({
            data: {
                message: [sponsorInfo, additionalInfo].filter(Boolean).join('\n'),
            },
        });
        handleItemClick();
    });
    const handleReportSponsoredMessage = useLastCallback(() => {
        reportSponsored({ randomId });
        handleItemClick();
    });
    if (!anchor) {
        return undefined;
    }
    return (<div ref={ref} className="ContextMenuContainer">
      <SponsoredContextMenu isOpen={isOpen} anchor={anchor} triggerRef={triggerRef} canReport={canReport} sponsorInfo={sponsorInfo} shouldSkipAbout={shouldSkipAbout} onClose={onClose} onCloseAnimationEnd={onClose} onAboutAdsClick={handleAboutAdsOpen} onSponsoredHide={handleSponsoredHide} onSponsorInfo={handleSponsorInfo} onSponsoredReport={handleReportSponsoredMessage}/>
    </div>);
};
export default memo(SponsoredMessageContextMenuContainer);
