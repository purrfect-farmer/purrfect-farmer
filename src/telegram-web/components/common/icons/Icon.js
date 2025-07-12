import buildClassName from '../../../util/buildClassName';
const Icon = ({ name, ref, className, style, role, ariaLabel, character, onClick, }) => {
    return (<i ref={ref} className={buildClassName(`icon icon-${name}`, className)} style={style} aria-hidden={!ariaLabel} aria-label={ariaLabel} data-char={character} role={role} onClick={onClick}/>);
};
export default Icon;
