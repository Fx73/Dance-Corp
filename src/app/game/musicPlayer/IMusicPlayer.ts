import { Directive, EventEmitter, Input, OnInit, inject } from "@angular/core";

import { UserConfigService } from "src/app/services/userconfig.service";

export interface IMusicPlayer {
    musicUrl: string; // Unique identifier for the music track
    startOffset?: number; // Optional start offset in seconds

    play(): void; // Start playback
    stop(): void; // Stop playback and reset
    getCurrentTime(): number; // Get the current playback time
    setToTime(time: number): void; // Set the playback time to a specific value

    onReady: EventEmitter<IMusicPlayer>;


}

@Directive()
export class MusicPlayerCommon {
    protected userConfig = inject(UserConfigService);
  
    @Input()
    size: { width: number | string; height: number | string } = { width: '1', height: '1' };


    public static pickMusicPlayer(uri: string): MusicOrigin | null {
        if (!uri) return null;

        if (uri.includes("youtube") || uri.includes("youtu.be"))
            return MusicOrigin.Youtube;

        if (uri.includes("soundcloud.com"))
            return MusicOrigin.Soundcloud;

        if (uri.startsWith("local:"))
            return MusicOrigin.Local;

        return null;
    }

    public static musicOriginAllowCache(musicOrigin: MusicOrigin): boolean {
        switch (musicOrigin) {
            case MusicOrigin.Youtube:
                return false;
            case MusicOrigin.Soundcloud:
                return true;
            default:
                return false;
        }
    }

    public getVolume(): number {
        return this.userConfig.getConfig()["musicVolume"] ?? 1;
    }
}

export enum MusicOrigin {
    Youtube = 0,
    Soundcloud = 1,
    Local = 2
}
