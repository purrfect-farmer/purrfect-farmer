import { useRef } from '../../lib/teact/teact';
export default function freezeWhenClosed(Component) {
    function ComponentWrapper(props) {
        const newProps = useRef(props);
        if (props.ignoreFreeze)
            return Component(props);
        if (props.isOpen) {
            newProps.current = props;
        }
        else {
            newProps.current = {
                ...newProps.current,
                isOpen: false,
            };
        }
        return Component(newProps.current);
    }
    return ComponentWrapper;
}
