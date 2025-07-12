import { memo, useState } from '../../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../../global';
import { getPeerTitle } from '../../../../global/helpers/peers';
import { selectUser } from '../../../../global/selectors';
import { formatStarsAsText } from '../../../../util/localization/format';
import useCurrentOrPrev from '../../../../hooks/useCurrentOrPrev';
import useLang from '../../../../hooks/useLang';
import useLastCallback from '../../../../hooks/useLastCallback';
import Checkbox from '../../../ui/Checkbox';
import ConfirmDialog from '../../../ui/ConfirmDialog';
const ChatRefundModal = ({ modal, user }) => {
    const { closeChatRefundModal, toggleNoPaidMessagesException } = getActions();
    const [shouldRefundStars, setShouldRefundStars] = useState(false);
    const renderingModal = useCurrentOrPrev(modal);
    const renderingUser = useCurrentOrPrev(user);
    const { starsToRefund, userId } = renderingModal || {};
    const lang = useLang();
    const isOpen = Boolean(modal);
    const handleConfirmRemoveFee = useLastCallback(() => {
        closeChatRefundModal();
        if (!userId)
            return;
        toggleNoPaidMessagesException({ userId, shouldRefundCharged: shouldRefundStars });
    });
    return (<ConfirmDialog isOpen={isOpen} onClose={closeChatRefundModal} title={lang('RemoveFeeTitle')} confirmLabel={lang('ConfirmRemoveMessageFee')} confirmHandler={handleConfirmRemoveFee}>
      {lang('ConfirmDialogMessageRemoveFee', {
            peer: renderingUser && getPeerTitle(lang, renderingUser),
        }, {
            withMarkdown: true,
            withNodes: true,
        })}
      {Boolean(starsToRefund) && (<Checkbox className="dialog-checkbox" label={lang('ConfirmDialogRemoveFeeRefundStars', {
                amount: formatStarsAsText(lang, starsToRefund),
            }, {
                withMarkdown: true,
                withNodes: true,
            })} checked={shouldRefundStars} onCheck={setShouldRefundStars}/>)}
    </ConfirmDialog>);
};
export default memo(withGlobal((global, { modal }) => {
    const user = modal?.userId ? selectUser(global, modal.userId) : undefined;
    return {
        user,
    };
})(ChatRefundModal));
