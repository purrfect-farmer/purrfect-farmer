const DEFAULT_HANDLERS = {
    play: undefined,
    pause: undefined,
    seekbackward: undefined,
    seekforward: undefined,
    previoustrack: undefined,
    nexttrack: undefined,
    stop: undefined,
    seekTo: undefined,
};
export function registerMediaSession(metadata, handlers) {
    const { mediaSession } = window.navigator;
    if (mediaSession) {
        if (metadata)
            updateMetadata(metadata);
        if (handlers)
            setMediaSessionHandlers(handlers);
    }
    else {
        // eslint-disable-next-line no-console
        console.warn('MediaSession API not supported in this browser');
    }
}
export function updateMetadata(metadata) {
    const { mediaSession } = window.navigator;
    if (mediaSession) {
        // eslint-disable-next-line no-null/no-null
        mediaSession.metadata = metadata ?? null;
    }
}
export function setMediaSessionHandlers(handlers) {
    const { mediaSession } = window.navigator;
    if (mediaSession) {
        Object.entries({ ...DEFAULT_HANDLERS, ...handlers }).forEach(([key, handler]) => {
            try {
                // @ts-ignore API not standardized yet
                mediaSession.setActionHandler(key, handler);
            }
            catch (err) {
                // Handler not supported, ignoring
            }
        });
    }
}
export function clearMediaSession() {
    const { mediaSession } = window.navigator;
    if (mediaSession) {
        // eslint-disable-next-line no-null/no-null
        mediaSession.metadata = null;
        setMediaSessionHandlers(DEFAULT_HANDLERS);
        if (mediaSession.playbackState)
            mediaSession.playbackState = 'none';
        mediaSession.setPositionState?.();
    }
}
export function setPlaybackState(state = 'none') {
    const { mediaSession } = window.navigator;
    if (mediaSession && mediaSession.playbackState) {
        mediaSession.playbackState = state;
    }
}
export function setPositionState(state) {
    if (!state || state.position === undefined || state.duration === undefined)
        return;
    state.position = Math.min(state.position, state.duration);
    const { mediaSession } = window.navigator;
    mediaSession?.setPositionState?.(state);
}
export function buildMediaMetadata({ title, artist, album, artwork, }) {
    if ('MediaMetadata' in window) {
        return new window.MediaMetadata({
            title,
            artist,
            album,
            artwork,
        });
    }
    return undefined;
}
