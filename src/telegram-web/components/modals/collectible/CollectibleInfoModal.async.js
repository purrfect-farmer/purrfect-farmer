import { Bundles } from '../../../util/moduleLoader';
import useModuleLoader from '../../../hooks/useModuleLoader';
const CollectibleInfoModalAsync = (props) => {
    const { modal } = props;
    const CollectibleInfoModal = useModuleLoader(Bundles.Extra, 'CollectibleInfoModal', !modal);
    return CollectibleInfoModal ? <CollectibleInfoModal {...props}/> : undefined;
};
export default CollectibleInfoModalAsync;
