import { memo } from '../../lib/teact/teact';
import { Bundles } from '../../util/moduleLoader';
import useModuleLoader from '../../hooks/useModuleLoader';
const StoryViewerAsync = ({ isOpen }) => {
    const StoryViewer = useModuleLoader(Bundles.Extra, 'StoryViewer', !isOpen);
    return StoryViewer ? <StoryViewer /> : undefined;
};
export default memo(StoryViewerAsync);
