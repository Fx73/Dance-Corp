import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { IMusicPlayer, MusicPlayerCommon } from '../IMusicPlayer';

import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-music-player-local',
  template: '',
})
export class MusicPlayerLocalComponent extends MusicPlayerCommon implements IMusicPlayer, OnInit {

  @Input() musicUrl!: string;
  onReady = new EventEmitter<IMusicPlayer>();
  private audio!: HTMLAudioElement;

  isPlaying = false;
  currentTime = 0;
  duration = 0;

  ngOnInit(): void {
    const safeUrl = Capacitor.convertFileSrc(this.musicUrl.replace("local:", ""));
    console.log("Initializing local music player with safe URL:", safeUrl);
    this.audio = new Audio();
    this.audio.src = safeUrl;
    this.audio.preload = 'auto';

    this.audio.addEventListener('canplaythrough', () => {
      this.onReady.emit(this);
    });
  }

  play(): void {
    this.audio.play();
    this.isPlaying = true;
  }

  stop(): void {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.isPlaying = false;

  }

  getCurrentTime(): number {
    return this.audio.currentTime;
  }

  setToTime(event: any): void {
    const value = event.target.value;
    this.audio.currentTime = value;
  }

  formatTime(sec: number): string {
    if (!sec) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
}
