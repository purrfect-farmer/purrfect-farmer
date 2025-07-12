import { Bundles } from '../../../util/moduleLoader';
import useModuleLoader from '../../../hooks/useModuleLoader';
const PhoneCallAsync = (props) => {
    const { isActive } = props;
    const PhoneCall = useModuleLoader(Bundles.Calls, 'PhoneCall', !isActive);
    return PhoneCall ? <PhoneCall /> : undefined;
};
export default PhoneCallAsync;
