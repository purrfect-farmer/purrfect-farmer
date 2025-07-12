import { memo, useCallback, useEffect } from '../../lib/teact/teact';
import { getActions } from '../../global';
import { TME_LINK_PREFIX } from '../../config';
import useOldLang from '../../hooks/useOldLang';
import './ConfirmPayment.scss';
const ConfirmPayment = ({ url, noRedirect, onClose, onPaymentFormSubmit, }) => {
    const { openTelegramLink } = getActions();
    const lang = useOldLang();
    const handleMessage = useCallback((event) => {
        try {
            const data = JSON.parse(event.data);
            const { eventType, eventData } = data;
            switch (eventType) {
                case 'web_app_open_tg_link':
                    if (!noRedirect) {
                        const linkUrl = TME_LINK_PREFIX + eventData.path_full;
                        openTelegramLink({ url: linkUrl });
                    }
                    onClose();
                    break;
                case 'payment_form_submit':
                    if (onPaymentFormSubmit) {
                        onPaymentFormSubmit(eventData);
                    }
                    break;
                default:
                    onClose();
                    break;
            }
        }
        catch (err) {
            // Ignore other messages
        }
    }, [onClose, noRedirect, openTelegramLink, onPaymentFormSubmit]);
    useEffect(() => {
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [handleMessage]);
    return (<div className="ConfirmPayment">
      <iframe src={url} title={lang('Checkout.WebConfirmation.Title')} allow="payment" sandbox="allow-modals allow-forms allow-scripts allow-same-origin allow-top-navigation" className="ConfirmPayment__content"/>
    </div>);
};
export default memo(ConfirmPayment);
