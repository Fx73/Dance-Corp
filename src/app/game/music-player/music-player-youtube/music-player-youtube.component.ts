import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core'
import { YOUTUBE_PLAYER_CONFIG, YouTubePlayer } from '@angular/youtube-player'
import { IMusicPlayer, MusicPlayerCommon } from '../IMusicPlayer'

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
export class MusicPlayerYoutubeComponent extends MusicPlayerCommon implements IMusicPlayer {
  playerConfig = {
    controls: 0,
    mute: 0,
    autoplay: 1,
  }

  @Input()
  musicUrl!: string
  @Input()
  startOffset?: number = 0

  @Output()
  ready: EventEmitter<IMusicPlayer> = new EventEmitter<IMusicPlayer>()

  @ViewChild('musicPlayer') player!: YouTubePlayer

  constructor() {
    super()
  }

  // This method is called when the YouTube player is ready. 
  // It can use : event: YT.PlayerEvent
  OnReadyInternal(): void {
    this.player.stopVideo()
    this.player.setVolume(this.GetVolume() * 100)

    this.ready.emit(this)
  }

  Play(): void {
    this.player.playVideo()
  }

  Stop(): void {
    this.player.stopVideo()
  }

  GetCurrentTime(): number {
    return this.player.getCurrentTime() - (this.startOffset ?? 0)
  }

  SetToTime(time: number): void {
    this.player.seekTo(time + (this.startOffset ?? 0), true)
  }

  public ExtractVideoId(url: string): string {
    const match = url.match(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([0-9A-Za-z_-]{11})/
    )
    return match ? match[1] : ''
  }

}
