import { Directive, EventEmitter, Input, inject } from "@angular/core"

import { UserConfigService } from "src/app/services/userconfig.service"

export interface IMusicPlayer {
    musicUrl: string // Unique identifier for the music track
    startOffset?: number // Optional start offset in seconds

    Play(): void // Start playback
    Stop(): void // Stop playback and reset
    GetCurrentTime(): number // Get the current playback time
    SetToTime(time: number): void // Set the playback time to a specific value

    ready: EventEmitter<IMusicPlayer>

}

@Directive()
export class MusicPlayerCommon {
    protected userConfig = inject(UserConfigService)

    @Input()
    size: { width: number | string, height: number | string } = { width: '1', height: '1' }

    public GetVolume(): number {
        return this.userConfig.GetConfig()["musicVolume"]
    }

    //#region Statics
    public static PickMusicPlayer(uri: string | undefined): MusicOrigin | null {
        if (!uri) return null

        if (uri.includes("youtube") || uri.includes("youtu.be"))
            return MusicOrigin.Youtube

        if (uri.includes("soundcloud.com"))
            return MusicOrigin.Soundcloud

        if (uri.startsWith("local:"))
            return MusicOrigin.Local

        return null
    }

    public static MusicOriginAllowCache(musicOrigin: MusicOrigin): boolean {
        switch (musicOrigin) {
            case MusicOrigin.Youtube:
                return false
            case MusicOrigin.Soundcloud:
                return true
            default:
                return false
        }
    }
    //#endregion
}

export enum MusicOrigin {
    Youtube = 0,
    Soundcloud = 1,
    Local = 2
}
