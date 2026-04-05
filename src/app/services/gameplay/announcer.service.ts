import { Injectable } from "@angular/core";
import { UserConfigService } from "../userconfig.service";

@Injectable({ providedIn: 'root' })
export class AnnouncerService {
    private announcers: any[] = [];
    private crowd: any;
    private preferredAnnouncer: any;
    private lastAnnouncerLine: string | null = null;
    private failSatisfaction = 0;
    private goodSatisfaction = 0;
    private perfectSatisfaction = 0;


    // --- CHANNELS ---
    private announcerAudio: HTMLAudioElement | null = null;
    private announcerQueue: { announcer: any, line: string }[] = [];
    private isQueueBlocked: boolean = false;

    private crowdAudio: HTMLAudioElement | null = null

    constructor(private userConfigService: UserConfigService) {}

    async init() {
        this.announcers = [
            await fetch('assets/Sounds/announcers/girl1.json').then(r => r.json()),
            await fetch('assets/Sounds/announcers/girl2.json').then(r => r.json()),
            await fetch('assets/Sounds/announcers/boy.json').then(r => r.json())
        ];
        this.crowd = await fetch('assets/Sounds/announcers/crowd.json').then(r => r.json());

        this.pickPreferredAnnouncer();
    }

    // -------------------------
    // ANNOUNCER
    // -------------------------
    pickPreferredAnnouncer() {
        this.preferredAnnouncer = this.random(this.announcers);
    }

    changeSatisfaction( type: number, amount: number) {
        // type: 0 = fail, 1 = good, 2 = perfect
        if (type === 0) {
            this.failSatisfaction += amount;
            this.goodSatisfaction -=1;
            this.perfectSatisfaction -=2;
        }
        else if (type === 1) {
            this.goodSatisfaction += amount;
            this.failSatisfaction -=1;
            this.perfectSatisfaction -=1;
        }
        else if (type === 2) {
            this.perfectSatisfaction += amount;
            this.failSatisfaction -=2;
            this.goodSatisfaction -=1;
        }

        this.failSatisfaction = Math.max(0, this.failSatisfaction);
        this.goodSatisfaction = Math.max(0, this.goodSatisfaction);
        this.perfectSatisfaction = Math.max(0, this.perfectSatisfaction);

        if (this.failSatisfaction > 30) {
            this.playAnnouncer("combo_fail");
            this.failSatisfaction = 0;
            this.goodSatisfaction /= 2;
            this.perfectSatisfaction /= 2;
        }
        else if (this.goodSatisfaction > 30) {
            this.playAnnouncer("combo_good");
            this.goodSatisfaction = 0;
            this.failSatisfaction /= 2;
            this.perfectSatisfaction /= 2;
        }
        else if (this.perfectSatisfaction > 30) {
            this.playAnnouncer("combo_perfect");
            this.playCrowdOneShot("applause_light", 4000);
            this.perfectSatisfaction = 0;
            this.failSatisfaction /= 2;
            this.goodSatisfaction /= 2;
        }

        console.log(`Satisfaction - Fail: ${this.failSatisfaction}, Good: ${this.goodSatisfaction}, Perfect: ${this.perfectSatisfaction}`);
    }

    playAnnouncer(category: string) {
        if (!this.preferredAnnouncer) return;

        let lines = this.preferredAnnouncer.lines[category];
        if (lines) {
            const line = this.pickNoRepeat(lines, this.lastAnnouncerLine);
            this.enqueueAnnouncerLine(this.preferredAnnouncer, line);
            return
        }

        for (const ann of this.announcers) {
            if (ann === this.preferredAnnouncer) continue;
            if (ann.lines[category]) {
                const line = this.pickNoRepeat(ann.lines[category], this.lastAnnouncerLine);
                this.enqueueAnnouncerLine(ann, line);
                return;
            }
        }
    }
    playAnnouncerLine(category: string, line: string) {
        if (!this.preferredAnnouncer) return;

        if (this.preferredAnnouncer.lines[category]?.includes(line)) {
            this.enqueueAnnouncerLine(this.preferredAnnouncer, line);
            return
        }

        for (const ann of this.announcers) {
            if (ann === this.preferredAnnouncer) continue;
            if (ann.lines[category]?.includes(line)) {
                this.enqueueAnnouncerLine(ann, line);
                return;
            }
        }

    }

    public testAnnouncerSound() {
        const volume = this.getAnnouncerVolume();
        if (this.announcerAudio) {
            this.announcerAudio.volume = volume;
            return;
        }
        
        const announcer = this.random(this.announcers);
        const category = this.random(Object.keys(announcer.lines));
        const line : any = this.random(announcer.lines[category]);
        
        this.playAnnouncerDirect(announcer, line, this.processAnnouncerQueue.bind(this));
    }

    private enqueueAnnouncerLine(announcer: any, line: string) {
        this.lastAnnouncerLine = line;
        this.announcerQueue.push({ announcer, line });
        this.processAnnouncerQueue();
    }

    private processAnnouncerQueue() {
        if (this.announcerAudio || this.isQueueBlocked) return;

        const next = this.announcerQueue.shift();

        if (!next) return;

        this.playAnnouncerDirect(next.announcer, next.line, this.processAnnouncerQueue.bind(this));
    }

    async playCountdownFromAnnouncer(delayMs: number = 1000) {
        console.log("Request to play countdown from announcer received");
        if (!this.preferredAnnouncer || this.isQueueBlocked) return;

        let announcer = this.preferredAnnouncer.lines["countdown"] ? this.preferredAnnouncer : this.announcers.find(ann => ann.lines["countdown"]);

        if (!announcer) return;

        const order = ["three", "two", "one", "go"];



        this.isQueueBlocked = true;

        for (const line of order) {
            if (this.announcerAudio) { //Priority to countdown, even for previous countdown if still playing
                this.announcerAudio.pause();
                this.announcerAudio.currentTime = 0;
            }
            this.playAnnouncerDirect(announcer, line);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }

        this.isQueueBlocked = false;
        this.announcerAudio = null;

        this.processAnnouncerQueue();
    }


    private playAnnouncerDirect(announcer: any, line: string, onEndCallback?: () => void) {
        const src = `assets/Sounds/announcers/${announcer.name}/${line}.ogg`;

        this.announcerAudio = new Audio(src);
        this.announcerAudio.volume = this.getAnnouncerVolume();
        
        if (onEndCallback) {
            this.announcerAudio.onended = () => {
                this.announcerAudio = null;
                onEndCallback();
            }
        }

        this.announcerAudio.play();
    }




    // -------------------------
    // CROWD / AMBIANCE
    // -------------------------
    playCrowdOneShot(type: string, fadeOutMs: number = 4000) {
        const list = this.crowd.lines[type];
        if (!list) return;

        // Crowd sounds can't overlap
        if (this.crowdAudio && !this.crowdAudio.paused) return;

        const file = this.random(list);
        const src = `assets/Sounds/announcers/crowd/${file}.ogg`;

        this.crowdAudio = this.playAudio(src, { volume: this.getAnnouncerVolume(), fadeOutMs });
    }


    // -------------------------
    // UTILS
    // -------------------------
    private getAnnouncerVolume(): number {
        return this.userConfigService.getConfig()["announcersVolume"] ?? 1;
    }

    private random<T>(arr: T[]): T {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    private pickNoRepeat(arr: string[], last: string | null) {
        let pick;
        do {
            pick = this.random(arr);
        } while (arr.length > 1 && pick === last);
        return pick;
    }

    private playAudio(src: string, options: { volume?: number, fadeOutMs?: number } = {}) {
        const audio = new Audio(src);
        audio.volume = options.volume ?? 1;

        audio.play();

        // Si pas de fade-out → on s'arrête là
        if (!options.fadeOutMs) return audio;

        const fadeDuration = options.fadeOutMs;
        const fadeSteps = 20;
        const stepTime = fadeDuration / fadeSteps;
        const volumeStep = audio.volume / fadeSteps;

        setTimeout(() => {
            let currentStep = 0;
            const fadeInterval = setInterval(() => {
                currentStep++;
                audio.volume = Math.max(0, audio.volume - volumeStep);

                if (currentStep >= fadeSteps) {
                    clearInterval(fadeInterval);
                    audio.pause();
                    audio.currentTime = 0;
                }
            }, stepTime);
        }, audio.duration * 1000 - fadeDuration); // commence le fade-out avant la fin

        return audio;
    }

}
