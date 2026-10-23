import { Injectable, inject } from "@angular/core"
import { UserConfigService } from "../userconfig.service"
import { CONFIG } from "src/app/game/constants/game-config"
import { SatisfactionType } from "src/app/game/constants/satisfaction-type.enum"

/** Content of the assets/Sounds/announcers/*.json files */
interface ISoundBank {
    type: string
    name: string
    lines: Record<string, string[]>
}

@Injectable({ providedIn: 'root' })
export class AnnouncerService {
    private userConfigService = inject(UserConfigService)

    private announcers: ISoundBank[] = []
    private crowd!: ISoundBank
    private preferredAnnouncer?: ISoundBank
    private lastAnnouncerLine: string | null = null
    private failSatisfaction = 0
    private goodSatisfaction = 0
    private perfectSatisfaction = 0

    // --- CHANNELS ---
    private announcerAudio: HTMLAudioElement | null = null
    private announcerQueue: { announcer: ISoundBank, line: string }[] = []
    private isQueueBlocked: boolean = false

    private crowdAudio: HTMLAudioElement | null = null

    async Init() {
        this.announcers = [
            await fetch('assets/Sounds/announcers/girl1.json').then(r => r.json()),
            await fetch('assets/Sounds/announcers/girl2.json').then(r => r.json()),
            await fetch('assets/Sounds/announcers/boy.json').then(r => r.json())
        ]
        this.crowd = await fetch('assets/Sounds/announcers/crowd.json').then(r => r.json())

        this.PickPreferredAnnouncer()
    }

    // -------------------------
    // ANNOUNCER
    // -------------------------
    PickPreferredAnnouncer() {
        this.preferredAnnouncer = this.Random(this.announcers)
    }

    ChangeSatisfaction(type: SatisfactionType, amount: number) {
        if (type === SatisfactionType.Fail) {
            this.failSatisfaction += amount
            this.goodSatisfaction -=1
            this.perfectSatisfaction -=2
        }
        else if (type === SatisfactionType.Good) {
            this.goodSatisfaction += amount
            this.failSatisfaction -=1
            this.perfectSatisfaction -=1
        }
        else if (type === SatisfactionType.Perfect) {
            this.perfectSatisfaction += amount
            this.failSatisfaction -=2
            this.goodSatisfaction -=1
        }

        this.failSatisfaction = Math.max(0, this.failSatisfaction)
        this.goodSatisfaction = Math.max(0, this.goodSatisfaction)
        this.perfectSatisfaction = Math.max(0, this.perfectSatisfaction)

        if (this.failSatisfaction > CONFIG.ANNOUNCER.COMBO_LINE_THRESHOLD) {
            this.PlayAnnouncer("combo_fail")
            this.failSatisfaction = 0
            this.goodSatisfaction /= 2
            this.perfectSatisfaction /= 2
        }
        else if (this.goodSatisfaction > CONFIG.ANNOUNCER.COMBO_LINE_THRESHOLD) {
            this.PlayAnnouncer("combo_good")
            this.goodSatisfaction = 0
            this.failSatisfaction /= 2
            this.perfectSatisfaction /= 2
        }
        else if (this.perfectSatisfaction > CONFIG.ANNOUNCER.COMBO_LINE_THRESHOLD) {
            this.PlayAnnouncer("combo_perfect")
            this.PlayCrowdOneShot("applause_light")
            this.perfectSatisfaction = 0
            this.failSatisfaction /= 2
            this.goodSatisfaction /= 2
        }

    }

    PlayAnnouncer(category: string) {
        if (!this.preferredAnnouncer) return

        const lines = this.preferredAnnouncer.lines[category]
        if (lines) {
            const line = this.PickNoRepeat(lines, this.lastAnnouncerLine)
            this.EnqueueAnnouncerLine(this.preferredAnnouncer, line)
            return
        }

        for (const ann of this.announcers) {
            if (ann === this.preferredAnnouncer) continue
            if (ann.lines[category]) {
                const line = this.PickNoRepeat(ann.lines[category], this.lastAnnouncerLine)
                this.EnqueueAnnouncerLine(ann, line)
                return
            }
        }
    }

    PlayAnnouncerLine(category: string, line: string) {
        if (!this.preferredAnnouncer) return

        if (this.preferredAnnouncer.lines[category]?.includes(line)) {
            this.EnqueueAnnouncerLine(this.preferredAnnouncer, line)
            return
        }

        for (const ann of this.announcers) {
            if (ann === this.preferredAnnouncer) continue
            if (ann.lines[category]?.includes(line)) {
                this.EnqueueAnnouncerLine(ann, line)
                return
            }
        }

    }

    public TestAnnouncerSound() {
        const volume = this.GetAnnouncerVolume()
        if (this.announcerAudio) {
            this.announcerAudio.volume = volume
            return
        }
        
        const announcer = this.Random(this.announcers)
        const category = this.Random(Object.keys(announcer.lines))
        const line = this.Random(announcer.lines[category])
        
        this.PlayAnnouncerDirect(announcer, line, this.ProcessAnnouncerQueue.bind(this))
    }

    private EnqueueAnnouncerLine(announcer: ISoundBank, line: string) {
        this.lastAnnouncerLine = line
        this.announcerQueue.push({ announcer, line })
        this.ProcessAnnouncerQueue()
    }

    private ProcessAnnouncerQueue() {
        if (this.announcerAudio || this.isQueueBlocked) return

        const next = this.announcerQueue.shift()

        if (!next) return

        this.PlayAnnouncerDirect(next.announcer, next.line, this.ProcessAnnouncerQueue.bind(this))
    }

    async PlayCountdownFromAnnouncer(delayMs: number = 1000) {
        if (!this.preferredAnnouncer || this.isQueueBlocked) return

        const announcer = this.preferredAnnouncer.lines["countdown"] ? this.preferredAnnouncer : this.announcers.find(ann => ann.lines["countdown"])

        if (!announcer) return

        const order = ["three", "two", "one", "go"]

        this.isQueueBlocked = true

        for (const line of order) {
            if (this.announcerAudio) { //Priority to countdown, even for previous countdown if still playing
                this.announcerAudio.pause()
                this.announcerAudio.currentTime = 0
            }
            this.PlayAnnouncerDirect(announcer, line)
            await new Promise(resolve => setTimeout(resolve, delayMs))
        }

        this.isQueueBlocked = false
        this.announcerAudio = null

        this.ProcessAnnouncerQueue()
    }

    private PlayAnnouncerDirect(announcer: ISoundBank, line: string, onEndCallback?: () => void) {
        const src = `assets/Sounds/announcers/${announcer.name}/${line}.ogg`

        this.announcerAudio = new Audio(src)
        this.announcerAudio.volume = this.GetAnnouncerVolume()
        
        if (onEndCallback) {
            this.announcerAudio.onended = () => {
                this.announcerAudio = null
                onEndCallback()
            }
        }

        this.announcerAudio.play()
    }

    // -------------------------
    // CROWD / AMBIANCE
    // -------------------------
    PlayCrowdOneShot(type: string, fadeOutMs: number = CONFIG.ANNOUNCER.CROWD_FADE_OUT_MS) {
        const list = this.crowd.lines[type]
        if (!list) return

        // Crowd sounds can't overlap
        if (this.crowdAudio && !this.crowdAudio.paused) return

        const file = this.Random(list)
        const src = `assets/Sounds/announcers/crowd/${file}.ogg`

        this.crowdAudio = this.PlayAudio(src, { volume: this.GetAnnouncerVolume(), fadeOutMs })
    }

    // -------------------------
    // UTILS
    // -------------------------
    private GetAnnouncerVolume(): number {
        return this.userConfigService.GetConfig()["announcersVolume"] ?? 1
    }

    private Random<T>(arr: T[]): T {
        return arr[Math.floor(Math.random() * arr.length)]
    }

    private PickNoRepeat(arr: string[], last: string | null) {
        let pick
        do {
            pick = this.Random(arr)
        } while (arr.length > 1 && pick === last)
        return pick
    }

    private PlayAudio(src: string, options: { volume?: number, fadeOutMs?: number } = {}) {
        const audio = new Audio(src)
        audio.volume = options.volume ?? 1

        audio.play()

        // No fade-out: stop here
        if (!options.fadeOutMs) return audio

        const fadeDuration = options.fadeOutMs
        const fadeSteps = 20
        const stepTime = fadeDuration / fadeSteps
        const volumeStep = audio.volume / fadeSteps

        const ScheduleFadeOut = () => setTimeout(() => {
            let currentStep = 0
            const fadeInterval = setInterval(() => {
                currentStep++
                audio.volume = Math.max(0, audio.volume - volumeStep)

                if (currentStep >= fadeSteps) {
                    clearInterval(fadeInterval)
                    audio.pause()
                    audio.currentTime = 0
                }
            }, stepTime)
        }, audio.duration * 1000 - fadeDuration) // start the fade-out before the end

        // duration is NaN until the metadata is loaded
        if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) ScheduleFadeOut()
        else audio.addEventListener("loadedmetadata", ScheduleFadeOut, { once: true })

        return audio
    }

}
