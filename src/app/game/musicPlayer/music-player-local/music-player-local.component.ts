import { BaseDirectory, readFile } from '@tauri-apps/plugin-fs';
import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { IMusicPlayer, MusicPlayerCommon } from '../IMusicPlayer';

@Component({
  selector: 'app-music-player-local',
  templateUrl: './music-player-local.component.html',
  styleUrls: ['./music-player-local.component.scss'],
  standalone: true,
  imports: []
})
export class MusicPlayerLocalComponent extends MusicPlayerCommon implements IMusicPlayer, OnInit {

  @Input() musicUrl!: string;
  @Output() onReady = new EventEmitter<IMusicPlayer>();
  private audio!: HTMLAudioElement;

  isPlaying = false;
  currentTime = signal(0);
  duration = signal(0);

  constructor() {
    super();
  }

  async ngOnInit(): Promise<void> {
    const url = this.musicUrl.replace("local:", "");
    const localUri = await this.createMusicUri(url);
    console.log("Created local music URI:", localUri);
    this.audio = new Audio();
    this.audio.src = localUri;
    this.audio.preload = 'auto';

    this.audio.addEventListener('loadedmetadata', () => {
      this.duration.set(this.audio.duration);
    });

    this.audio.addEventListener('timeupdate', () => {
      this.currentTime.set(this.audio.currentTime);
    });

    this.audio.addEventListener('canplaythrough', () => {
      this.onReady.emit(this);
    });

  }

  async createMusicUri(path: string): Promise<string> {
    const mimeType = guessMimeType(path);

    const bytes = await readFile(path, { baseDir: BaseDirectory.AppData });
    const blob = new Blob([bytes], { type: mimeType });
    return URL.createObjectURL(blob);

    function guessMimeType(path: string): string {
      const ext = path.split('.').pop()?.toLowerCase();

      switch (ext) {
        case "mp3": return "audio/mpeg";
        case "wav": return "audio/wav";
        case "ogg": return "audio/ogg";
        case "opus": return "audio/opus";
        case "m4a": return "audio/mp4";
        case "flac": return "audio/flac";
        default: return "audio/*";
      }
    }
  }



  play(): void {
    this.audio.play();
    this.isPlaying = true;
  }

  stop(): void {
    this.audio.pause();
    this.isPlaying = false;

  }

  getCurrentTime(): number {
    return this.audio?.currentTime ?? 0;
  }

  getDuration(): number {
    return this.audio?.duration ?? 0;
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
