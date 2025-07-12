import { Bundles } from '../../../util/moduleLoader';
import useModuleLoader from '../../../hooks/useModuleLoader';
const UrlAuthModalAsync = (props) => {
    const { modal } = props;
    const UrlAuthModal = useModuleLoader(Bundles.Extra, 'UrlAuthModal', !modal);
    return UrlAuthModal ? <UrlAuthModal {...props}/> : undefined;
};
export default UrlAuthModalAsync;
