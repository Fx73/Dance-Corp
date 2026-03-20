/** Running on a desktop app or a mobile app, but not in the browser */
const isTauri = '__TAURI_INTERNALS__' in window;

/** Running in the browser on either desktop or mobile, but not as a tauri app */
export const isWeb = !isTauri;

/** Running on mobile either in the browser or as a tauri app */
export const isMobile = navigator.maxTouchPoints > 0;
/** Running on desktop either in the browser or as a tauri app */
export const isDesktop = !isMobile;

/** Running on mobile as a tauri app, but not on the browser */
export const isTauriMobile = isTauri && isMobile;
/** Running on desktop as a tauri app, but not on the browser */
export const isTauriDesktop = isTauri && isDesktop;

/** Running on mobile in the browser, but not as a tauri app */
export const isWebMobile = isWeb && isMobile;
/** Running on desktop in the browser, but not as a tauri app */
export const isWebDesktop = isWeb && isDesktop;

export default isTauri;