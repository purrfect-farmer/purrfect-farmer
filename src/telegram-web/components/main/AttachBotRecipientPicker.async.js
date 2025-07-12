import { Bundles } from '../../util/moduleLoader';
import useModuleLoader from '../../hooks/useModuleLoader';
const AttachBotRecipientPickerAsync = (props) => {
    const { requestedAttachBotInChat } = props;
    const AttachBotRecipientPicker = useModuleLoader(Bundles.Extra, 'AttachBotRecipientPicker', !requestedAttachBotInChat);
    return AttachBotRecipientPicker ? <AttachBotRecipientPicker {...props}/> : undefined;
};
export default AttachBotRecipientPickerAsync;
