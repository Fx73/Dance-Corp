import { Injectable } from '@angular/core'
import { Subject } from 'rxjs'
import { invoke } from '@tauri-apps/api/core'
import isTauri from 'src/app/shared/utils/tauri'
import { listen } from '@tauri-apps/api/event'

/** A gamepad plugged in, as the system sees it (src-tauri/src/gamepad.rs) */
export type NativeGamepad = {
    id: number
    name: string
    vendorId: number | null
    productId: number | null
}

/**
 * Desktop only: the gamepads plugged in, from Tauri. The webview lists a gamepad only once
 * one of its buttons is pressed, the system lists it as soon as it is plugged.
 * In the browser, nothing is known: every lookup answers null.
 */
@Injectable({ providedIn: 'root' })
export class NativeGamepadService {

    private gamepads: NativeGamepad[] = []
    private isAvailable = false

    /** A gamepad plugged in while the app runs */
    readonly connected: Subject<NativeGamepad> = new Subject()

    async Init() {
        if (!isTauri) return

        try {
            await listen<NativeGamepad>("native-gamepad-connected", event => {
                this.gamepads = [...this.gamepads.filter(gamepad => gamepad.id !== event.payload.id), event.payload]
                this.connected.next(event.payload)
            })
            await listen<number>("native-gamepad-disconnected", event => {
                this.gamepads = this.gamepads.filter(gamepad => gamepad.id !== event.payload)
            })
            this.gamepads = await invoke<NativeGamepad[]>("list_gamepads")
            this.isAvailable = true
            console.log("Native gamepads:", this.gamepads)
        } catch (e) {
            console.warn("Native gamepad watch failed", e)
        }
    }

    /** Whether the gamepad of this webview id is plugged in, null when it cannot be told (browser, id without vendor and product) */
    IsPlugged(webGamepadId: string): boolean | null {
        if (!this.isAvailable) return null
        const device = NativeGamepadService.ParseDeviceIds(webGamepadId)
        if (device === null) return null
        return this.gamepads.some(gamepad => NativeGamepadService.IsSameDevice(gamepad, device))
    }

    //#region Statics
    /** Whether this native gamepad is the one of this webview id, null when it cannot be told */
    static IsGamepadOf(gamepad: NativeGamepad, webGamepadId: string): boolean | null {
        const device = NativeGamepadService.ParseDeviceIds(webGamepadId)
        return device === null ? null : NativeGamepadService.IsSameDevice(gamepad, device)
    }

    /**
     * Vendor and product ids written in a webview gamepad id: "Pad (Vendor: 0079 Product: 0011)" (Chromium, WebView2),
     * or "0079-0011-Pad" (Firefox, WebKitGTK). Null when absent, like for XInput gamepads on Windows.
     */
    static ParseDeviceIds(webGamepadId: string): { vendorId: number, productId: number } | null {
        const match = /Vendor: ([0-9a-f]{1,4}) Product: ([0-9a-f]{1,4})/i.exec(webGamepadId)
            ?? /^([0-9a-f]{1,4})-([0-9a-f]{1,4})-/i.exec(webGamepadId)
        if (match === null) return null
        return { vendorId: parseInt(match[1], 16), productId: parseInt(match[2], 16) }
    }

    private static IsSameDevice(gamepad: NativeGamepad, device: { vendorId: number, productId: number }): boolean {
        return gamepad.vendorId === device.vendorId && gamepad.productId === device.productId
    }
    //#endregion
}
