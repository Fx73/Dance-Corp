import { BaseDirectory, readFile } from '@tauri-apps/plugin-fs'
import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core'
import { IMusicPlayer, MusicPlayerCommon } from '../IMusicPlayer'

@Component({
  selector: 'app-music-player-local',
  templateUrl: './music-player-local.component.html',
  styleUrls: ['./music-player-local.component.scss'],
  standalone: true,
  imports: []
})
export class MusicPlayerLocalComponent extends MusicPlayerCommon implements IMusicPlayer, OnInit {

  @Input() musicUrl!: string
  @Input() startOffset?: number
  @Output() ready: EventEmitter<IMusicPlayer> = new EventEmitter()
  private audio!: HTMLAudioElement

  isPlaying = false
  currentTime = signal(0)
  duration = signal(0)

  constructor() {
    super()
  }

  async ngOnInit(): Promise<void> {
    const url = this.musicUrl.replace("local:", "")
    const localUri = await this.CreateMusicUri(url)
    this.audio = new Audio()
    this.audio.src = localUri
    this.audio.volume = this.GetVolume()
    this.audio.preload = 'auto'
    
    if (this.startOffset)
      this.audio.currentTime = this.startOffset

    this.audio.addEventListener('loadedmetadata', () => {
      this.duration.set(this.audio.duration)
    })

    this.audio.addEventListener('timeupdate', () => {
      this.currentTime.set(this.audio.currentTime)
    })

    this.audio.addEventListener('canplaythrough', () => {
      this.ready.emit(this)
    })

  }

  async CreateMusicUri(path: string): Promise<string> {
    const mimeType = GuessMimeType(path)

    const bytes = await readFile(path, { baseDir: BaseDirectory.AppData })
    const blob = new Blob([bytes], { type: mimeType })
    return URL.createObjectURL(blob)

    function GuessMimeType(path: string): string {
      const ext = path.split('.').pop()?.toLowerCase()

      switch (ext) {
        case "mp3": return "audio/mpeg"
        case "wav": return "audio/wav"
        case "ogg": return "audio/ogg"
        case "opus": return "audio/opus"
        case "m4a": return "audio/mp4"
        case "flac": return "audio/flac"
        default: return "audio/*"
      }
    }
  }

  Play(): void {
    this.audio.play()
    this.isPlaying = true
  }

  Stop(): void {
    this.audio.pause()
    this.isPlaying = false

  }

  GetCurrentTime(): number {
    return (this.audio?.currentTime ?? 0) - (this.startOffset ?? 0)
  }

  GetDuration(): number {
    return (this.audio?.duration ?? 0) - (this.startOffset ?? 0)
  }

  SetToTime(time: number): void {
    this.audio.currentTime = time + (this.startOffset ?? 0)
  }

  OnSeekInput(event: Event): void {
    this.SetToTime(Number((event.target as HTMLInputElement).value))
  }

  FormatTime(sec: number): string {
    if (!sec) return '0:00'
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }
}
