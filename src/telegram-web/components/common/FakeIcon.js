import { memo } from '../../lib/teact/teact';
import useOldLang from '../../hooks/useOldLang';
import './FakeIcon.scss';
const FakeIcon = ({ fakeType, }) => {
    const lang = useOldLang();
    return (<span className="FakeIcon">
      {lang(fakeType === 'fake' ? 'FakeMessage' : 'ScamMessage')}
    </span>);
};
export default memo(FakeIcon);
