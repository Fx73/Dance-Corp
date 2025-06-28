import { Injectable } from '@angular/core';
import { RPCClient } from './discordRPC/discord-rpc-client';

export const discordConfig = {
    clientId: '1360379286720352366',
}

@Injectable({
    providedIn: 'root',
})
export class DiscordService {

    private rpc: RPCClient;
    private imageKey = 'splashrounded';
    private startTimestamp?: Date;
    private songName?: string;

    constructor() {
        const scopes = ['rpc', 'rpc.api', 'messages.read'];

        this.rpc = new RPCClient(discordConfig.clientId, { transport: 'websocket' });
        console.log('Discord RPC Client created');

        this.rpc.$rpcReady.subscribe(() => {
            console.log('Discord RPC Client is ready!');
            this.updateActivity();
        });

        this.rpc.login({ clientId: 'NotNeeded' }).catch(console.error);
    }

    async updateActivity() {
        if (!this.rpc) return;
        this.songName = "example song";
        this.startTimestamp = new Date(new Date().getTime() - (Math.floor(Math.random() * 10000) * 1000));

        this.rpc.setActivity({
            details: `Playing the song ${this.songName}`,
            state: `By Dance Corp`,
            startTimestamp: this.startTimestamp,
            largeImageKey: this.imageKey,
            instance: false,
        });

        console.log(`[${new Date().toLocaleTimeString()}] Updated Rich Presence - ${this.songName}`);
    }
}
