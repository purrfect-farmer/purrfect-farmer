import { Bundles } from '../../util/moduleLoader';
import useModuleLoader from '../../hooks/useModuleLoader';
import Loading from '../ui/Loading';
const GifSearchAsync = () => {
    const GifSearch = useModuleLoader(Bundles.Extra, 'GifSearch');
    return GifSearch ? <GifSearch /> : <Loading />;
};
export default GifSearchAsync;
