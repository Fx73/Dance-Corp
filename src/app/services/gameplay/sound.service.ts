import { NavigationEnd, Router } from "@angular/router";

import { Injectable } from "@angular/core";
import { UserConfigService } from 'src/app/services/userconfig.service';

@Injectable({ providedIn: 'root' })
export class SoundManager {
    readonly SOUND_BACKGROUND = new Audio('assets/Sounds/music/GGJ2024_Main.mp3');
    readonly SOUND_BACKGROUND2 = new Audio('assets/Sounds/music/GGJ2024_Main2.mp3');

    isPlaying = false;

    constructor(private userConfigService: UserConfigService, private router: Router) {
        this.SOUND_BACKGROUND.volume = 0;
        this.SOUND_BACKGROUND2.volume = 0;
        this.SOUND_BACKGROUND.loop = true;
        this.SOUND_BACKGROUND2.loop = true;


    }

  private handleRouteChange(url: string) {
    const shouldMute =
      url.startsWith('/play/browse') ||
      url.startsWith('/play/game') ||
      url.startsWith('/browse-upload') ||
      url.startsWith('/upload');

    if (shouldMute) {
      this.PauseBackgroundMusic();
    } else {
      this.StartBackgroundMusic();
    }
  }


    InitBackgroundMusic() {
        this.router.events.subscribe(event => {
            if (event instanceof NavigationEnd) {
                this.handleRouteChange(event.urlAfterRedirects);
            }
        });
        this.handleRouteChange(this.router.url);
    }

    StartBackgroundMusic() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.fadeIn(this.SOUND_BACKGROUND, 4000);

    }

    PauseBackgroundMusic() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        this.fadeOut(this.SOUND_BACKGROUND, 1000);
    }

    // -------------------------
    // FADES
    // -------------------------

    fadeIn(audio: HTMLAudioElement, duration = 500) {
        if ((audio as any)._fadeInterval) {
            clearInterval((audio as any)._fadeInterval);
        }

        audio.play();

        const step = 50;
        const increment = step / duration;

        // Si volume déjà > 0, on repart de là (permet d'inverser un fadeOut)
        audio.volume = Math.max(0, audio.volume);

        (audio as any)._fadeInterval = setInterval(() => {
            audio.volume = Math.min(this.getMusicVolume(), audio.volume + increment);

            if (audio.volume >= this.getMusicVolume()) {
                clearInterval((audio as any)._fadeInterval);
                (audio as any)._fadeInterval = null;
            }
        }, step);
    }

    fadeOut(audio: HTMLAudioElement, duration = 500) {
        if ((audio as any)._fadeInterval) {
            clearInterval((audio as any)._fadeInterval);
        }

        const step = 50;
        const decrement = step / duration;

        (audio as any)._fadeInterval = setInterval(() => {
            audio.volume = Math.max(0, audio.volume - decrement);

            if (audio.volume <= 0) {
                clearInterval((audio as any)._fadeInterval);
                (audio as any)._fadeInterval = null;
                audio.pause();
            }
        }, step);
    }


    // -------------------------
    // SFX
    // -------------------------
    playSfx(audio: HTMLAudioElement) {
        audio.volume = this.getSfxVolume();
        audio.currentTime = 0;
        audio.play();
    }


    
    // -------------------------
    // Utils
    // -------------------------
      public refreshMusicVolume() {
        this.SOUND_BACKGROUND.volume = this.getMusicVolume();
        this.SOUND_BACKGROUND2.volume = this.getMusicVolume();
      }
      private getMusicVolume(): number {
        return this.userConfigService.getConfig()["menuMusicVolume"] ?? 0.2;
    }
    private getSfxVolume(): number {
        return this.userConfigService.getConfig()["sfxVolume"] ?? 1;
    }
}
