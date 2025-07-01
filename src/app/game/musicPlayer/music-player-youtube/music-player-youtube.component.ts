import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { YOUTUBE_PLAYER_CONFIG, YouTubePlayer } from '@angular/youtube-player';

import { IMusicPlayer } from '../IMusicPlayer';
import { NgModule } from '@angular/core';

@Component({
  selector: 'app-music-player-youtube',
  templateUrl: './music-player-youtube.component.html',
  styleUrls: ['./music-player-youtube.component.scss'],
  imports: [YouTubePlayer],
  providers: [{
    provide: YOUTUBE_PLAYER_CONFIG,
    useValue: {
    }
  }]
})
export class MusicPlayerYoutubeComponent implements IMusicPlayer {
  playerConfig = {
    controls: 0,
    mute: 0,
    autoplay: 1,
  };

  @Input()
  musicUrl!: string;
  @Output()
  onReady: EventEmitter<IMusicPlayer> = new EventEmitter<IMusicPlayer>();

  @ViewChild('musicPlayer') player!: YouTubePlayer;

  constructor() { }

  onReadyInternal(event: any): void {
    console.log('YouTube Player is ready');
    this.player.stopVideo();
    this.onReady.emit(this);

  }



  play(): void {
    this.player.playVideo();
  }

  stop(): void {
    this.player.stopVideo();
  }

  getCurrentTime(): number {
    return this.player.getCurrentTime();
  }

  setToTime(time: number): void {
    this.player.seekTo(time, true);
  }

  public extractVideoId(url: string): string {
    const match = url.match(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([0-9A-Za-z_-]{11})/
    );
    return match ? match[1] : '';
  }
}
