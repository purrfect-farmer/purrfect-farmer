import { memo } from '../../lib/teact/teact';
import Transition from '../ui/Transition';
import Icon from './icons/Icon';
import './MessageOutgoingStatus.scss';
var Keys;
(function (Keys) {
    Keys[Keys["failed"] = 0] = "failed";
    Keys[Keys["pending"] = 1] = "pending";
    Keys[Keys["succeeded"] = 2] = "succeeded";
    Keys[Keys["read"] = 3] = "read";
})(Keys || (Keys = {}));
const MessageOutgoingStatus = ({ status }) => {
    return (<div className="MessageOutgoingStatus">
      <Transition name="reveal" activeKey={Keys[status]}>
        {status === 'failed' ? (<div className="MessageOutgoingStatus--failed">
            <Icon name="message-failed"/>
          </div>) : <Icon name={`message-${status}`}/>}
      </Transition>
    </div>);
};
export default memo(MessageOutgoingStatus);
