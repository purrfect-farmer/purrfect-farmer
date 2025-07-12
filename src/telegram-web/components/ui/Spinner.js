import buildClassName from '../../util/buildClassName';
import './Spinner.scss';
const Spinner = ({ color = 'blue', backgroundColor, className, }) => {
    return (<div className={buildClassName('Spinner', className, color, backgroundColor && 'with-background', backgroundColor && `bg-${backgroundColor}`)}>
      <div className="Spinner__inner"/>
    </div>);
};
export default Spinner;
