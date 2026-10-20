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

  private handleRouteChange(url: string) {
    const shouldMute =
      url.startsWith('/play/browse') ||
      url.startsWith('/play/game') ||
      url.startsWith('/browse-upload') ||
      url.startsWith('/upload')

    if (shouldMute) {
      this.pauseBackgroundMusic()
    } else {
      this.startBackgroundMusic()
    }
  }

    initBackgroundMusic() {
        this.router.events.subscribe(event => {
            if (event instanceof NavigationEnd) {
                this.handleRouteChange(event.urlAfterRedirects)
            }
        })
        this.handleRouteChange(this.router.url)
    }

    startBackgroundMusic() {
        if (this.isPlaying) return
        this.isPlaying = true
        this.fadeIn(this.SOUND_BACKGROUND, 4000)

    }

    pauseBackgroundMusic() {
        if (!this.isPlaying) return
        this.isPlaying = false
        this.fadeOut(this.SOUND_BACKGROUND, 1000)
    }

    // -------------------------
    // FADES
    // -------------------------

    fadeIn(audio: HTMLAudioElement, duration = 500) {
        if (this.fadeIntervals.has(audio)) {
            clearInterval(this.fadeIntervals.get(audio))
        }

        audio.play()

        const step = 50
        const increment = step / duration

        // If volume is already > 0, start from there (allows reversing a fadeOut)
        audio.volume = Math.max(0, audio.volume)

        this.fadeIntervals.set(audio, setInterval(() => {
            audio.volume = Math.min(this.getMusicVolume(), audio.volume + increment)

            if (audio.volume >= this.getMusicVolume()) {
                clearInterval(this.fadeIntervals.get(audio))
                this.fadeIntervals.delete(audio)
            }
        }, step))
    }

    fadeOut(audio: HTMLAudioElement, duration = 500) {
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
    playSfx(audio: HTMLAudioElement) {
        audio.volume = this.getSfxVolume()
        audio.currentTime = 0
        audio.play()
    }
    
    // -------------------------
    // Utils
    // -------------------------
      public refreshMusicVolume() {
        this.SOUND_BACKGROUND.volume = this.getMusicVolume()
        this.SOUND_BACKGROUND2.volume = this.getMusicVolume()
      }

      private getMusicVolume(): number {
        return this.userConfigService.getConfig()["menuMusicVolume"] ?? 0.2
    }

    private getSfxVolume(): number {
        return this.userConfigService.getConfig()["sfxVolume"] ?? 1
    }
}
