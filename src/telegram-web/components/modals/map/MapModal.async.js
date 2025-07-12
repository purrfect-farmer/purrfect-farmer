import { Bundles } from '../../../util/moduleLoader';
import useModuleLoader from '../../../hooks/useModuleLoader';
const MapModalAsync = (props) => {
    const { modal } = props;
    const MapModal = useModuleLoader(Bundles.Extra, 'MapModal', !modal);
    return MapModal ? <MapModal {...props}/> : undefined;
};
export default MapModalAsync;
