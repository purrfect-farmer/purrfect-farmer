import { Bundles } from '../../../util/moduleLoader';
import useModuleLoader from '../../../hooks/useModuleLoader';
const SymbolMenuAsync = (props) => {
    const { isOpen } = props;
    const SymbolMenu = useModuleLoader(Bundles.Extra, 'SymbolMenu', !isOpen);
    return SymbolMenu ? <SymbolMenu {...props}/> : undefined;
};
export default SymbolMenuAsync;
