import { Directive, EventEmitter, Input } from "@angular/core";

export interface IMusicPlayer {
    musicUrl: string; // Unique identifier for the music track

    play(): void; // Start playback
    stop(): void; // Stop playback and reset
    getCurrentTime(): number; // Get the current playback time
    //setToTime(time: number): void; // Set the playback time to a specific value

    onReady: EventEmitter<IMusicPlayer>;


}

@Directive()
export class MusicPlayerCommon {
    @Input()
    isRealSize: boolean = false;

    size: { width: number | string; height: number | string } = {
        width: 1,
        height: 1
    };

    constructor() {
        if (this.isRealSize)
            this.size = { width: '100%', height: '100%' };

    }

    public static pickMusicPlayer(uri: string): MusicOrigin | null {
        if (!uri) return null;

        if (uri.includes("youtube") || uri.includes("youtu.be"))
            return MusicOrigin.Youtube;

        if (uri.includes("soundcloud.com"))
            return MusicOrigin.Soundcloud;

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
}

export enum MusicOrigin {
    Youtube = 0,
    Soundcloud = 1,
}
