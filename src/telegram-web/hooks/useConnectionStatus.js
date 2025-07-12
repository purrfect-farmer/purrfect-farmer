import useBrowserOnline from './window/useBrowserOnline';
export var ConnectionStatus;
(function (ConnectionStatus) {
    ConnectionStatus[ConnectionStatus["waitingForNetwork"] = 0] = "waitingForNetwork";
    ConnectionStatus[ConnectionStatus["syncing"] = 1] = "syncing";
    ConnectionStatus[ConnectionStatus["online"] = 2] = "online";
})(ConnectionStatus || (ConnectionStatus = {}));
export default function useConnectionStatus(lang, connectionState, isSyncing, hasMiddleHeader, isMinimized, isDisabled) {
    let status;
    const isBrowserOnline = useBrowserOnline();
    if (!isBrowserOnline || connectionState === 'connectionStateConnecting') {
        status = ConnectionStatus.waitingForNetwork;
    }
    else if (isSyncing) {
        status = ConnectionStatus.syncing;
    }
    else {
        status = ConnectionStatus.online;
    }
    let position;
    if (status === ConnectionStatus.online || isDisabled) {
        position = 'none';
    }
    else if (hasMiddleHeader) {
        position = 'middleHeader';
    }
    else if (isMinimized) {
        position = 'minimized';
    }
    else {
        position = 'overlay';
    }
    let text;
    if (status === ConnectionStatus.waitingForNetwork) {
        text = lang('WaitingForNetwork');
    }
    else if (status === ConnectionStatus.syncing) {
        text = lang('Updating');
    }
    if (position === 'middleHeader') {
        text = text.toLowerCase().replace(/\.+$/, '');
    }
    return {
        connectionStatus: status,
        connectionStatusPosition: position,
        connectionStatusText: text,
    };
}
