import { Injectable } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';

@Injectable({ providedIn: 'root' })
export class PresenceService {

    private discordReady = false;
    private steamReady = false;

    async init() {
        // Discord
        try {
            await invoke("init_discord");
            this.discordReady = true;
        } catch (e) {
            console.warn("Discord RPC init failed", e);
        }

        // Steam
        try {
            await invoke("init_steam");
            this.steamReady = true;
        } catch (e) {
            console.warn("Steam init failed", e);
        }
    }


    async update(status: string, details: string = "") {

        // Discord
        if (this.discordReady) {
            await invoke("update_discord_rpc", { details, status });
        }

        // Steam
        if (this.steamReady) {
            await invoke("update_steam_rpc", { key: "status", value: status });
            await invoke("update_steam_rpc", { key: "details", value: details });
        }
    }

    async clear() {
        if (this.discordReady) {
            await invoke("clear_discord_rpc");
        }

        if (this.steamReady) {
            await invoke("clear_steam_rpc");
        }
    }
}
