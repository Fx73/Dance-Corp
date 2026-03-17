import { Component, EventEmitter, Input, OnInit } from '@angular/core';

import { IMusicPlayer } from '../IMusicPlayer';

@Component({
  selector: 'app-music-player-local',
  template: '',
})
export class MusicPlayerLocalComponent implements IMusicPlayer, OnInit {

  @Input() musicUrl!: string;

  onReady = new EventEmitter<IMusicPlayer>();

  private audio!: HTMLAudioElement;

  ngOnInit(): void {
    this.audio = new Audio();
    this.audio.src = this.musicUrl.replace("local://", "");
    this.audio.preload = 'auto';

    this.audio.addEventListener('canplaythrough', () => {
      this.onReady.emit(this);
    });
  }

  play(): void {
    this.audio.play();
  }

  stop(): void {
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  getCurrentTime(): number {
    return this.audio.currentTime;
  }
}
