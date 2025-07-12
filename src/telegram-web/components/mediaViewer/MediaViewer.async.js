import { Bundles } from '../../util/moduleLoader';
import useModuleLoader from '../../hooks/useModuleLoader';
const MediaViewerAsync = ({ isOpen }) => {
    const MediaViewer = useModuleLoader(Bundles.Extra, 'MediaViewer', !isOpen);
    return MediaViewer ? <MediaViewer /> : undefined;
};
export default MediaViewerAsync;
