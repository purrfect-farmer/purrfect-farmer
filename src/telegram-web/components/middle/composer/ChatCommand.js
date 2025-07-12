import { memo } from '../../../lib/teact/teact';
import buildClassName from '../../../util/buildClassName';
import renderText from '../../common/helpers/renderText';
import useLastCallback from '../../../hooks/useLastCallback';
import Avatar from '../../common/Avatar';
import ListItem from '../../ui/ListItem';
import './ChatCommand.scss';
const ChatCommand = ({ withAvatar, focus, command, description, peer, clickArg, onClick, }) => {
    const handleClick = useLastCallback(() => {
        onClick(clickArg);
    });
    return (<ListItem key={command} className={buildClassName('BotCommand chat-item-clickable scroll-item', withAvatar && 'with-avatar')} multiline onClick={handleClick} focus={focus}>
      {withAvatar && (<Avatar size="small" peer={peer}/>)}
      <div className="content-inner">
        <span className="title">
          /
          {command}
        </span>
        <span className="subtitle">{renderText(description)}</span>
      </div>
    </ListItem>);
};
export default memo(ChatCommand);
