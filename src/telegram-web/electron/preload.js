import { contextBridge, ipcRenderer } from 'electron';
import { ElectronAction } from '../types/electron';
const electronApi = {
    isFullscreen: () => ipcRenderer.invoke(ElectronAction.GET_IS_FULLSCREEN),
    installUpdate: () => ipcRenderer.invoke(ElectronAction.INSTALL_UPDATE),
    handleDoubleClick: () => ipcRenderer.invoke(ElectronAction.HANDLE_DOUBLE_CLICK),
    openNewWindow: (url) => ipcRenderer.invoke(ElectronAction.OPEN_NEW_WINDOW, url),
    setWindowTitle: (title) => ipcRenderer.invoke(ElectronAction.SET_WINDOW_TITLE, title),
    setWindowButtonsPosition: (position) => ipcRenderer.invoke(ElectronAction.SET_WINDOW_BUTTONS_POSITION, position),
    /**
     * @deprecated Use `setWindowButtonsPosition` instead
     */
    setTrafficLightPosition: (position) => ipcRenderer.invoke(ElectronAction.SET_WINDOW_BUTTONS_POSITION, position),
    setIsAutoUpdateEnabled: (value) => ipcRenderer.invoke(ElectronAction.SET_IS_AUTO_UPDATE_ENABLED, value),
    getIsAutoUpdateEnabled: () => ipcRenderer.invoke(ElectronAction.GET_IS_AUTO_UPDATE_ENABLED),
    setIsTrayIconEnabled: (value) => ipcRenderer.invoke(ElectronAction.SET_IS_TRAY_ICON_ENABLED, value),
    getIsTrayIconEnabled: () => ipcRenderer.invoke(ElectronAction.GET_IS_TRAY_ICON_ENABLED),
    restoreLocalStorage: () => ipcRenderer.invoke(ElectronAction.RESTORE_LOCAL_STORAGE),
    on: (eventName, callback) => {
        const subscription = (event, ...args) => callback(...args);
        ipcRenderer.on(eventName, subscription);
        return () => {
            ipcRenderer.removeListener(eventName, subscription);
        };
    },
};
contextBridge.exposeInMainWorld('electron', electronApi);
