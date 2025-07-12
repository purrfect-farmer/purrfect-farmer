import buildClassName from '../../../util/buildClassName';
import buildStyle from '../../../util/buildStyle';
import './Skeleton.scss';
const Skeleton = ({ variant = 'rectangular', animation = 'wave', width, height, forceAspectRatio, inline, className, }) => {
    const classNames = buildClassName('Skeleton', variant, animation, className, inline && 'inline');
    const aspectRatio = (width && height) ? `aspect-ratio: ${width}/${height}` : undefined;
    const style = buildStyle(forceAspectRatio && aspectRatio, Boolean(width) && `width: ${width}px`, !forceAspectRatio && Boolean(height) && `height: ${height}px`);
    return (<div className={classNames} style={style}>{inline && '\u00A0'}</div>);
};
export default Skeleton;
