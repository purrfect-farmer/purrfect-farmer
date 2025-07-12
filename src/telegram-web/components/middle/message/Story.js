import { memo } from '../../../lib/teact/teact';
import { withGlobal } from '../../../global';
import { selectPeerStory } from '../../../global/selectors';
import BaseStory from './BaseStory';
function Story({ message, story, isProtected, isConnected, }) {
    const { storyData } = message.content;
    return (<BaseStory story={story || storyData} isProtected={isProtected} isConnected={isConnected}/>);
}
export default memo(withGlobal((global, { message }) => {
    const { id, peerId } = message.content.storyData;
    return {
        story: selectPeerStory(global, peerId, id),
        isConnected: global.connectionState === 'connectionStateReady',
    };
})(Story));
