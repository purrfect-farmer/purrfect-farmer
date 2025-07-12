import { memo, useMemo } from '../../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../../global';
import { selectIsInSelectMode, selectIsMessageSelected, } from '../../../../global/selectors';
import buildClassName from '../../../../util/buildClassName';
import useLastCallback from '../../../../hooks/useLastCallback';
import Icon from '../../../common/icons/Icon';
export default function withSelectControl(WrappedComponent) {
    const ComponentWithSelectControl = (props) => {
        const { isInSelectMode, isSelected, dimensions, clickArg, } = props;
        const { toggleMessageSelection } = getActions();
        const handleMessageSelect = useLastCallback((e) => {
            e.stopPropagation();
            toggleMessageSelection({ messageId: clickArg, withShift: e?.shiftKey });
        });
        const newProps = useMemo(() => {
            const { dimensions: dims, onClick } = props;
            return {
                ...props,
                isInSelectMode,
                isSelected,
                dimensions: {
                    ...dims,
                    x: 0,
                    y: 0,
                },
                onClick: isInSelectMode ? undefined : onClick,
            };
        }, [props, isInSelectMode, isSelected]);
        return (<div className={buildClassName('album-item-select-wrapper', isSelected && 'is-selected')} style={dimensions ? `left: ${dimensions.x}px; top: ${dimensions.y}px;` : ''} onClick={isInSelectMode ? handleMessageSelect : undefined}>
        {isInSelectMode && (<div className="message-select-control">
            {isSelected && (<Icon name="select"/>)}
          </div>)}
        
        <WrappedComponent {...newProps}/>
      </div>);
    };
    return memo(withGlobal((global, ownProps) => {
        const { clickArg, noSelectControls } = ownProps;
        return {
            isInSelectMode: !noSelectControls && selectIsInSelectMode(global),
            isSelected: !noSelectControls && selectIsMessageSelected(global, clickArg),
        };
    })(ComponentWithSelectControl));
}
