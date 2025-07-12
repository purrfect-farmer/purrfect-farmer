import { memo } from '../../lib/teact/teact';
import useOldLang from '../../hooks/useOldLang';
import Icon from '../common/icons/Icon';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import Transition from '../ui/Transition';
import './ConnectionStatusOverlay.scss';
const ConnectionStatusOverlay = ({ connectionStatus, connectionStatusText, onClick, }) => {
    const lang = useOldLang();
    return (<div id="ConnectionStatusOverlay" dir={lang.isRtl ? 'rtl' : undefined} onClick={onClick}>
      <Spinner color="black"/>
      <div className="state-text">
        <Transition activeKey={connectionStatus} name="slideFade">
          {connectionStatusText}
        </Transition>
      </div>
      <Button round size="tiny" color="translucent-black">
        <Icon name="close"/>
      </Button>
    </div>);
};
export default memo(ConnectionStatusOverlay);
