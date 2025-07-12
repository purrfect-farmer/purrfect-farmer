let systemThemeCache = (window.matchMedia?.('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
let themeChangeCallback;
export function getSystemTheme() {
    return systemThemeCache;
}
function handleSystemThemeChange(e) {
    systemThemeCache = e.matches ? 'dark' : 'light';
    themeChangeCallback?.(systemThemeCache);
}
export function setSystemThemeChangeCallback(callback) {
    themeChangeCallback = callback;
}
window.matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', handleSystemThemeChange);
