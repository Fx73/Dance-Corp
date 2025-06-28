import { EventEmitter } from "@angular/core";

export interface IMusicPlayer {
    play(): void; // Start playback
    stop(): void; // Stop playback and reset
    getCurrentTime(): number; // Get the current playback time
    setToTime(time: number): void; // Set the playback time to a specific value

    onReady: EventEmitter<any>;
}

export enum MusicOrigin {
    Youtube = 0
}