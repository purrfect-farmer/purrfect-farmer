import { Bundles } from '../../../util/moduleLoader';
import useModuleLoader from '../../../hooks/useModuleLoader';
const SharePreparedMessageModalAsync = (props) => {
    const { modal } = props;
    const SharePreparedMessageModal = useModuleLoader(Bundles.Extra, 'SharePreparedMessageModal', !modal);
    return SharePreparedMessageModal ? <SharePreparedMessageModal {...props}/> : undefined;
};
export default SharePreparedMessageModalAsync;
