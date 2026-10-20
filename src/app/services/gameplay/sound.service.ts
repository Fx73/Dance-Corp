import { NavigationEnd, Router } from "@angular/router"

import { Injectable, inject } from "@angular/core"
import { UserConfigService } from 'src/app/services/userconfig.service'

@Injectable({ providedIn: 'root' })
export class SoundService {
    //#region Constants
    readonly SOUND_BACKGROUND = new Audio('assets/Sounds/music/GGJ2024_Main.mp3')
    readonly SOUND_BACKGROUND2 = new Audio('assets/Sounds/music/GGJ2024_Main2.mp3')
    //#endregion

    private userConfigService = inject(UserConfigService)
    private router = inject(Router)

    private fadeIntervals: Map<HTMLAudioElement, ReturnType<typeof setInterval>> = new Map()

    isPlaying = false

    constructor() {
        this.SOUND_BACKGROUND.volume = 0
        this.SOUND_BACKGROUND2.volume = 0
        this.SOUND_BACKGROUND.loop = true
        this.SOUND_BACKGROUND2.loop = true

    }

  private HandleRouteChange(url: string) {
    const shouldMute =
      url.startsWith('/play/browse') ||
      url.startsWith('/play/game') ||
      url.startsWith('/browse-upload') ||
      url.startsWith('/upload')

    if (shouldMute) {
      this.PauseBackgroundMusic()
    } else {
      this.StartBackgroundMusic()
    }
  }

    InitBackgroundMusic() {
        this.router.events.subscribe(event => {
            if (event instanceof NavigationEnd) {
                this.HandleRouteChange(event.urlAfterRedirects)
            }
        })
        this.HandleRouteChange(this.router.url)
    }

    StartBackgroundMusic() {
        if (this.isPlaying) return
        this.isPlaying = true
        this.FadeIn(this.SOUND_BACKGROUND, 4000)

    }

    PauseBackgroundMusic() {
        if (!this.isPlaying) return
        this.isPlaying = false
        this.FadeOut(this.SOUND_BACKGROUND, 1000)
    }

    // -------------------------
    // FADES
    // -------------------------

    FadeIn(audio: HTMLAudioElement, duration = 500) {
        if (this.fadeIntervals.has(audio)) {
            clearInterval(this.fadeIntervals.get(audio))
        }

        audio.play()

        const step = 50
        const increment = step / duration

        // If volume is already > 0, start from there (allows reversing a fadeOut)
        audio.volume = Math.max(0, audio.volume)

        this.fadeIntervals.set(audio, setInterval(() => {
            audio.volume = Math.min(this.GetMusicVolume(), audio.volume + increment)

            if (audio.volume >= this.GetMusicVolume()) {
                clearInterval(this.fadeIntervals.get(audio))
                this.fadeIntervals.delete(audio)
            }
        }, step))
    }

    FadeOut(audio: HTMLAudioElement, duration = 500) {
        if (this.fadeIntervals.has(audio)) {
            clearInterval(this.fadeIntervals.get(audio))
        }

        const step = 50
        const decrement = step / duration

        this.fadeIntervals.set(audio, setInterval(() => {
            audio.volume = Math.max(0, audio.volume - decrement)

            if (audio.volume <= 0) {
                clearInterval(this.fadeIntervals.get(audio))
                this.fadeIntervals.delete(audio)
                audio.pause()
            }
        }, step))
    }

    // -------------------------
    // SFX
    // -------------------------
    PlaySfx(audio: HTMLAudioElement) {
        audio.volume = this.GetSfxVolume()
        audio.currentTime = 0
        audio.play()
    }
    
    // -------------------------
    // Utils
    // -------------------------
      public RefreshMusicVolume() {
        this.SOUND_BACKGROUND.volume = this.GetMusicVolume()
        this.SOUND_BACKGROUND2.volume = this.GetMusicVolume()
      }

      private GetMusicVolume(): number {
        return this.userConfigService.GetConfig()["menuMusicVolume"] ?? 0.2
    }

    private GetSfxVolume(): number {
        return this.userConfigService.GetConfig()["sfxVolume"] ?? 1
    }
}
