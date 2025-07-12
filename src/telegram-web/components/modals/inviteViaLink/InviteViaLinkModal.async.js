import { Bundles } from '../../../util/moduleLoader';
import useModuleLoader from '../../../hooks/useModuleLoader';
const InviteViaLinkModalAsync = (props) => {
    const { modal } = props;
    const InviteViaLinkModal = useModuleLoader(Bundles.Extra, 'InviteViaLinkModal', !modal);
    return InviteViaLinkModal ? <InviteViaLinkModal {...props}/> : undefined;
};
export default InviteViaLinkModalAsync;
