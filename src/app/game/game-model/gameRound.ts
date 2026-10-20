import { ArrowState, IDancePad } from "../game-controller/dancepad.interface"

import { AnnouncerService } from 'src/app/services/gameplay/announcer.service'
import { Arrow } from "./arrows/arrow"
import { ArrowDirection } from 'src/app/game/constants/arrow-direction.enum'
import { ArrowManager } from './arrows/arrowManager'
import { ArrowType } from "../constants/arrow-type.enum"
import { CONFIG } from './../constants/game-config'
import { DancePadGamepad } from "../game-controller/dancepad-gamepad"
import { DancePadKeyboard } from '../game-controller/dancepad-keyboard'
import { NoteDataDto } from "./music.dto"
import { Player } from "./player"

export class GameRound {
    //#region App Constants
    readonly ArrowDirection = ArrowDirection
    readonly MAX_SCORE = 1000000
    //#endregion

    // Sound
    private mineHitSound = new Audio('assets/Sounds/gameFx/player_mine.mp3')

    //Game Data
    arrowManager: ArrowManager

    //Player Data
    public player: Player
    dancepad: IDancePad

    //Game variables
    private isTrainingMode = false
    public score: number = 0
    public performance: number = 50
    public currentArrowIndex: number = 0 // Tracks the last note out of game
    public isFailed = false
    public isFinished = false
    public comboCount: number = 0
    public level: number = 1

    private scorePerArrow: number = 0
    private scorePerHoldBeat: number = 0

    //Display consuming
    precisionMessage: Arrow[] = [] // Message to display on the screen
    currentBeat: number = 0 // Current beat in the game to display

    constructor(notes: NoteDataDto, player: Player, isTrainingMode = false, private announcerService: AnnouncerService) {
        this.player = player

        if (player.gamepad!.index === -1)
            this.dancepad = new DancePadKeyboard(player.keyBindingKeyboard)
        else
            this.dancepad = new DancePadGamepad(player.gamepad!.index!, player.keyBindingGamepad)

        this.level = notes.meter ?? 1
        this.arrowManager = new ArrowManager(notes)

        this.CalculateScore()

        if (isTrainingMode) {
            this.isTrainingMode = true
            this.performance = 100
        }
    }

    private CalculateScore() {
        const arrowMap = this.arrowManager.arrowMap
        const holdArrows = arrowMap.filter(arrow => arrow.type === ArrowType.Hold)
        const tapArrows = arrowMap.filter(arrow => arrow.type === ArrowType.Tap)

        // Calculate total hold percentage for score
        const totalHoldTime = holdArrows.reduce((total, arrow) => total + (arrow.beatEnd!) - arrow.beatPosition, 0)
        const totalTaps = tapArrows.length
        const totalWeight = totalTaps + totalHoldTime

        // Point attribution
        const tapPoints = this.MAX_SCORE * (totalTaps / totalWeight)
        const holdPoints = this.MAX_SCORE * (totalHoldTime / totalWeight)

        this.scorePerArrow = tapPoints / totalTaps
        this.scorePerHoldBeat = holdPoints / totalHoldTime

    }

    public GameLoop(currentBeat: number, tolerance: number): void {
        const arrowMap = this.arrowManager.arrowMap
        this.currentBeat = currentBeat

        // Get DancePad state
        const padstate = this.dancepad.GetRefreshedState()

        if (this.isFinished)
            return

        // Check arrows
        let currentArrowCheck = this.currentArrowIndex
        while (currentArrowCheck < arrowMap.length && arrowMap[currentArrowCheck].beatPosition < currentBeat + tolerance) {
            const arrow = arrowMap[currentArrowCheck]
            if (!arrow.isOut) {
                this.CheckArrowPress(arrow, currentBeat, padstate[arrow.direction], tolerance)
            }
            currentArrowCheck++
        }

        // Pass out arrows
        while (arrowMap[this.currentArrowIndex].isOut) {
            this.currentArrowIndex++
            if (this.currentArrowIndex >= arrowMap.length) {
                this.EndVictory()
                return
            }
        }

        //Check Fail
        if (this.performance <= 0) {
            this.EndFail()
            return
        }
    }

    private CheckArrowPress(arrow: Arrow, currentBeat: number, padArrowState: ArrowState, tolerance: number) {
        if (arrow.type === ArrowType.Mine) {
            if (!arrow.isPressed && padArrowState === ArrowState.Press) {
                this.MineHit(arrow)
                console.log(`Hit mine at beat ${arrow.beatPosition}.`)
            } else {
                if (currentBeat > arrow.beatPosition + 1) {
                    this.MinePassed(arrow)
                    console.log(`Missed mine at beat ${arrow.beatPosition}.`)
                }
            }

        }

        if (arrow.type === ArrowType.Hold && arrow.isPressed) {
            if (arrow.beatEnd !== null && currentBeat > arrow.beatEnd) {
                this.ArrowOk(arrow)
                return
            }

            if (padArrowState !== ArrowState.Hold) {
                arrow.missedFrames--
                if (arrow.missedFrames <= 0)
                    this.ArrowMissed(arrow)
            }
            else if (arrow.missedFrames < CONFIG.GAME.MAX_MISSED_FRAME_HOLD)
                arrow.missedFrames++

            return
        }

        if (currentBeat > arrow.beatPosition + (2 * tolerance)) {
            arrow.isMissed = true
            this.ArrowMissed(arrow)
            console.log(`Missed arrow at beat ${arrow.beatPosition}.`)
            return
        }

        if (padArrowState === ArrowState.Press) {
            if (currentBeat > arrow.beatPosition + tolerance) {
                this.ArrowAlmost(arrow)
                console.log(`Almost arrow at beat ${arrow.beatPosition}.`)
                return
            }
            const difference = Math.abs(arrow.beatPosition - currentBeat)

            if (difference <= tolerance * 0.25) {
                // Perfect: Very close to the beat
                this.ArrowPerfect(arrow)
                console.log(`Perfect arrow at beat ${arrow.beatPosition}.`)
                return
            } else if (difference <= tolerance * 0.5) {
                // Great: Slightly off but close enough
                this.ArrowGreat(arrow)
                console.log(`Great arrow at beat ${arrow.beatPosition}.`)
                return
            } else if (difference <= tolerance) {
                // Good: Further off but still acceptable
                this.ArrowGood(arrow)
                console.log(`Good arrow at beat ${arrow.beatPosition}.`)
                return
            }
        }
    }

    ArrowPerfect(arrow: Arrow) {
        arrow.Perfect()
        this.UpdatePerformance(2)
        this.score += this.scorePerArrow
        this.comboCount++
        this.precisionMessage.push(arrow)

        this.announcerService.ChangeSatisfaction(2, 4)
    }

    ArrowGreat(arrow: Arrow) {
        arrow.Great()
        this.UpdatePerformance(1)
        this.score += this.scorePerArrow * 0.8
        this.comboCount++
        this.precisionMessage.push(arrow)

        if (this.comboCount >= 10)
            this.announcerService.ChangeSatisfaction(2, 2)
        else
            this.announcerService.ChangeSatisfaction(1, 4)
    }

    ArrowGood(arrow: Arrow) {
        arrow.Good()
        this.UpdatePerformance(1)
        this.score += this.scorePerArrow * 0.6
        this.comboCount++
        this.precisionMessage.push(arrow)

        if (this.comboCount >= 20)
            this.announcerService.ChangeSatisfaction(2, 1)
        else
            this.announcerService.ChangeSatisfaction(1, 2)
    }

    ArrowAlmost(arrow: Arrow) {
        arrow.Almost()
        this.UpdatePerformance(- 3)
        this.score += this.scorePerArrow * 0.2
        this.comboCount = 0
        this.precisionMessage.push(arrow)

        this.announcerService.ChangeSatisfaction(0, 1)
    }

    ArrowMissed(arrow: Arrow) {
        arrow.Missed()
        this.UpdatePerformance(-4)
        this.comboCount = 0
        this.precisionMessage.push(arrow)

        this.announcerService.ChangeSatisfaction(0, 4)
    }

    ArrowOk(arrow: Arrow) {
        arrow.Ok()
        const arrowLength = arrow.beatEnd! - arrow.beatPosition
        this.performance = Math.min(100, this.performance + arrowLength)
        this.score += arrowLength * this.scorePerHoldBeat
        this.precisionMessage.push(arrow)

        if (this.comboCount >= 10)
            this.announcerService.ChangeSatisfaction(2, 1)
        else
            this.announcerService.ChangeSatisfaction(1, 2)
    }

    MineHit(arrow: Arrow) {
        arrow.Boom()
        this.UpdatePerformance(-20)
        this.comboCount = 0
        this.precisionMessage.push(arrow)

        this.mineHitSound.currentTime = 0
        this.mineHitSound.play()

        this.announcerService.ChangeSatisfaction(0, 10)
    }

    MinePassed(arrow: Arrow) {
        arrow.Ok()
    }

    UpdatePerformance(amount: number): void {
        if (this.isTrainingMode || this.isFailed)
            return

        this.performance += amount

        if (this.performance > 100)
            this.performance = 100
        else if (this.performance < 0)
            this.performance = 0

    }

    EndFail() {
        this.isFailed = true
        this.performance = 1
    }

    EndVictory() {
        if (this.isFailed) return
        this.isFinished = true
    }
}
