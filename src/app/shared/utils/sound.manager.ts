export class SoundManager {
    static readonly SOUND_BACKGROUND = new Audio('assets/Sounds/music/GGJ2024_Main.mp3');
    static readonly SOUND_BACKGROUND2 = new Audio('assets/Sounds/music/GGJ2024_Main2.mp3');

    static isFading = false;
    static isPlaying = false;

    static InitBackgroundMusic() {
        this.SOUND_BACKGROUND.volume = 0.2;
        this.SOUND_BACKGROUND.loop = true;
    }
    static StartBackgroundMusic() {
        if (this.isPlaying || this.isFading) return;
        this.isPlaying = true;
        SoundManager.fadeIn(SoundManager.SOUND_BACKGROUND, 2000);
    }
    static PauseBackgroundMusic() {
        if (!this.isPlaying || this.isFading) return;
        this.isPlaying = false;
        SoundManager.fadeOut(SoundManager.SOUND_BACKGROUND);
    }

    static fadeIn(audio: HTMLAudioElement, duration = 500) {
        this.isFading = true;
        audio.volume = 0;
        audio.play();

        const step = 50;
        const increment = step / duration;

        const interval = setInterval(() => {
            audio.volume = Math.min(1, audio.volume + increment);
            if (audio.volume >= 1) {
                clearInterval(interval);
                this.isFading = false;
            }
        }, step);
    }
    static fadeOut(audio: HTMLAudioElement, duration = 500) {
        this.isFading = true;
        const step = 50;
        const decrement = step / duration;

        const interval = setInterval(() => {
            audio.volume = Math.max(0, audio.volume - decrement);
            if (audio.volume <= 0) {
                clearInterval(interval);
                audio.pause();
                this.isFading = false;
            }
        }, step);
    }

}