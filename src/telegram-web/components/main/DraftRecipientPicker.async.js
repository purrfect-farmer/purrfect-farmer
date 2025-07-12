import { Bundles } from '../../util/moduleLoader';
import useModuleLoader from '../../hooks/useModuleLoader';
const DraftRecipientPickerAsync = (props) => {
    const { requestedDraft } = props;
    const DraftRecipientPicker = useModuleLoader(Bundles.Extra, 'DraftRecipientPicker', !requestedDraft);
    return DraftRecipientPicker ? <DraftRecipientPicker {...props}/> : undefined;
};
export default DraftRecipientPickerAsync;
