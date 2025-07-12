import useShowTransition from './useShowTransition';
export default function useMediaTransition(mediaData, options) {
    const isMediaReady = Boolean(mediaData);
    const { ref } = useShowTransition({
        isOpen: isMediaReady,
        noMountTransition: isMediaReady,
        className: 'slow',
        ...options,
    });
    return ref;
}
