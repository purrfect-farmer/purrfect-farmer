export var ElectronEvent;
(function (ElectronEvent) {
    ElectronEvent["FULLSCREEN_CHANGE"] = "fullscreen-change";
    ElectronEvent["UPDATE_ERROR"] = "update-error";
    ElectronEvent["UPDATE_AVAILABLE"] = "update-available";
    ElectronEvent["DEEPLINK"] = "deeplink";
})(ElectronEvent || (ElectronEvent = {}));
export var ElectronAction;
(function (ElectronAction) {
    ElectronAction["GET_IS_FULLSCREEN"] = "get-is-fullscreen";
    ElectronAction["INSTALL_UPDATE"] = "install-update";
    ElectronAction["HANDLE_DOUBLE_CLICK"] = "handle-double-click";
    ElectronAction["OPEN_NEW_WINDOW"] = "open-new-window";
    ElectronAction["SET_WINDOW_TITLE"] = "set-window-title";
    ElectronAction["SET_WINDOW_BUTTONS_POSITION"] = "set-window-buttons-position";
    ElectronAction["SET_IS_AUTO_UPDATE_ENABLED"] = "set-is-auto-update-enabled";
    ElectronAction["GET_IS_AUTO_UPDATE_ENABLED"] = "get-is-auto-update-enabled";
    ElectronAction["SET_IS_TRAY_ICON_ENABLED"] = "set-is-tray-icon-enabled";
    ElectronAction["GET_IS_TRAY_ICON_ENABLED"] = "get-is-tray-icon-enabled";
    ElectronAction["RESTORE_LOCAL_STORAGE"] = "restore-local-storage";
})(ElectronAction || (ElectronAction = {}));
