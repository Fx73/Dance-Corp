import { Injectable } from '@angular/core'
import { invoke } from '@tauri-apps/api/core'

@Injectable({ providedIn: 'root' })
export class PresenceService {

    private discordReady = false
    private steamReady = false

    async Init() {
        // Discord
        try {
            await invoke("init_discord")
            this.discordReady = true
        } catch (e) {
            console.warn("Discord RPC init failed", e)
        }

        // Steam
        try {
            await invoke("init_steam")
            this.steamReady = true
        } catch (e) {
            console.warn("Steam init failed", e)
        }
    }

    /** Never throws: presence is optional, a failure must not interrupt the app */
    async Update(status: string, details: string = "") {
        // Discord
        try {
            if (this.discordReady)
                await invoke("update_discord_rpc", { details, status })
        } catch (e) {
            console.warn("Discord RPC update failed", e)
        }

        // Steam
        try {
            if (this.steamReady) {
                await invoke("update_steam_rpc", { key: "status", value: status })
                await invoke("update_steam_rpc", { key: "details", value: details })
            }
        } catch (e) {
            console.warn("Steam update failed", e)
        }
    }

    /** Never throws, like Update */
    async Clear() {
        try {
            if (this.discordReady)
                await invoke("clear_discord_rpc")
        } catch (e) {
            console.warn("Discord RPC clear failed", e)
        }

        try {
            if (this.steamReady)
                await invoke("clear_steam_rpc")
        } catch (e) {
            console.warn("Steam clear failed", e)
        }
    }
}
