import { Bundles } from '../../../util/moduleLoader';
import useModuleLoader from '../../../hooks/useModuleLoader';
const ContextMenuContainerAsync = (props) => {
    const { isOpen } = props;
    const ContextMenuContainer = useModuleLoader(Bundles.Extra, 'ContextMenuContainer', !isOpen);
    return ContextMenuContainer ? <ContextMenuContainer {...props}/> : undefined;
};
export default ContextMenuContainerAsync;
