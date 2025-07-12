import { memo } from '../../lib/teact/teact';
import buildClassName from '../../util/buildClassName';
import Spinner from './Spinner';
import './Loading.scss';
const Loading = ({ color = 'blue', backgroundColor, className, onClick, }) => {
    return (<div className={buildClassName('Loading', onClick && 'interactive', className)} onClick={onClick}>
      <Spinner color={color} backgroundColor={backgroundColor}/>
    </div>);
};
export default memo(Loading);
