import { memo, useCallback } from '../../lib/teact/teact';
import { getActions } from '../../global';
import useOldLang from '../../hooks/useOldLang';
import ConfirmDialog from '../ui/ConfirmDialog';
function StoryDeleteConfirmModal({ isOpen, story, onClose, }) {
    const { deleteStory, openNextStory } = getActions();
    const lang = useOldLang();
    const handleDeleteStoryClick = useCallback(() => {
        if (!story) {
            return;
        }
        openNextStory();
        deleteStory({ peerId: story.peerId, storyId: story.id });
        onClose();
    }, [onClose, story]);
    return (<ConfirmDialog isOpen={isOpen} onClose={onClose} title={lang('DeleteStoryTitle')} text={lang('DeleteStorySubtitle')} confirmLabel={lang('Delete')} confirmHandler={handleDeleteStoryClick} confirmIsDestructive className="component-theme-dark"/>);
}
export default memo(StoryDeleteConfirmModal);
