/** Console methods captured before SilenceConsole(), still active in production (toasts, easter eggs) */
export const productionConsole = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
}

/** Production: only productionConsole and console.error reach the console */
export function SilenceConsole(): void {
    console.log = Noop
    console.info = Noop
    console.debug = Noop
    console.warn = Noop

    function Noop(): void {
        // Silenced in production
    }
}
