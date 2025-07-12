import { Bundles } from '../../util/moduleLoader';
import useModuleLoader from '../../hooks/useModuleLoader';
const PrivacySettingsNoticeModalAsync = (props) => {
    const { isOpen } = props;
    const PrivacySettingsNoticeModal = useModuleLoader(Bundles.Extra, 'PrivacySettingsNoticeModal', !isOpen);
    return PrivacySettingsNoticeModal ? <PrivacySettingsNoticeModal {...props}/> : undefined;
};
export default PrivacySettingsNoticeModalAsync;
