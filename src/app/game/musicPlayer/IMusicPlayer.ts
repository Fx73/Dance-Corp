import { EventEmitter } from "@angular/core";

export interface IMusicPlayer {
    play(): void; // Start playback
    stop(): void; // Stop playback and reset
    getCurrentTime(): number; // Get the current playback time

    onReady: EventEmitter<any>;
}

export enum MusicOrigin {
    Youtube = 0
}