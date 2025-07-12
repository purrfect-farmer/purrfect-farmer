import { Bundles } from '../../../util/moduleLoader';
import useModuleLoader from '../../../hooks/useModuleLoader';
const LocationAccessModalAsync = (props) => {
    const { modal } = props;
    const LocationAccessModal = useModuleLoader(Bundles.Extra, 'LocationAccessModal', !modal);
    return LocationAccessModal ? <LocationAccessModal {...props}/> : undefined;
};
export default LocationAccessModalAsync;
