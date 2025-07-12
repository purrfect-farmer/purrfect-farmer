import useShowTransitionDeprecated from './useShowTransitionDeprecated';
export default function useMediaTransitionDeprecated(mediaData) {
    const isMediaReady = Boolean(mediaData);
    const { transitionClassNames } = useShowTransitionDeprecated(isMediaReady, undefined, isMediaReady, 'slow');
    return transitionClassNames;
}
