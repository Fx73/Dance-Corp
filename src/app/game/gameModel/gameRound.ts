import { ArrowState, DancePadInput, IDancePad } from "../gameController/dancepad.interface";
import { MusicDto, NoteDataDto } from "./music.dto";

import { Arrow } from "./arrowManagement/arrow";
import { ArrowDirection } from 'src/app/game/constants/arrow-direction.enum';
import { ArrowManager } from './arrowManagement/arrowManager';
import { ArrowType } from "../constants/arrow-type.enum";
import { CONFIG } from './../constants/game-config';
import { DancePadGamepad } from "../gameController/dancepad-gamepad";
import { DancePadKeyboard } from './../gameController/dancepad-keyboard';
import { Player } from "./player";
import { Precision } from "../constants/precision.enum";
import { SoundManager } from "../sound.manager";

export class GameRound {
    //#region App Constants
    readonly ArrowDirection = ArrowDirection;
    readonly MAX_SCORE = 1000000;
    //#endregion

    //Game Data
    arrowManager: ArrowManager;

    //Player Data
    public player: Player
    dancepad: IDancePad
    private soundManager: SoundManager = new SoundManager();

    //Game variables
    private isTrainingMode = false;
    public score: number = 0;
    public performance: number = 50;
    public currentArrowIndex: number = 0; // Tracks the last note out of game
    public isFailed = false;
    public isFinished = false;
    public comboCount: number = 0;
    public level: number = 1;

    private scorePerArrow: number = 0;
    private scorePerHoldBeat: number = 0;

    //Display consuming
    precisionMessage: Arrow[] = []; // Message to display on the screen
    currentBeat: number = 0; // Current beat in the game to display

    constructor(notes: NoteDataDto, player: Player, isTrainingMode = false) {
        this.player = player

        if (player.gamepad!.index! === -1)
            this.dancepad = new DancePadKeyboard(player.keyBindingKeyboard)
        else
            this.dancepad = new DancePadGamepad(player.gamepad!.index!, player.keyBindingGamepad)

        this.level = notes.meter ?? 1
        this.arrowManager = new ArrowManager(notes);

        this.calculateScore()

        if (isTrainingMode) {
            this.isTrainingMode = true
            this.performance = 100
        }

    }



    private calculateScore() {
        const arrowMap = this.arrowManager.arrowMap
        const holdArrows = arrowMap.filter(arrow => arrow.type === ArrowType.Hold)
        const tapArrows = arrowMap.filter(arrow => arrow.type === ArrowType.Tap)

        // Calculate total hold percentage for score
        const totalHoldTime = holdArrows.reduce((total, arrow) => total + (arrow.beatEnd!) - arrow.beatPosition, 0);
        const totalTaps = tapArrows.length;
        const totalWeight = totalTaps + totalHoldTime;

        // Point attribution
        const tapPoints = this.MAX_SCORE * (totalTaps / totalWeight);
        const holdPoints = this.MAX_SCORE * (totalHoldTime / totalWeight);


        this.scorePerArrow = tapPoints / totalTaps;
        this.scorePerHoldBeat = holdPoints / totalHoldTime;

    }


    public gameLoop(currentBeat: number, tolerance: number): void {
        const arrowMap = this.arrowManager.arrowMap
        this.currentBeat = currentBeat;

        // Get DancePad state
        const padstate = this.dancepad.getRefreshedState()

        if (this.isFinished)
            return

        // Check arrows
        let currentArrowCheck = this.currentArrowIndex
        while (currentArrowCheck < arrowMap.length && arrowMap[currentArrowCheck].beatPosition < currentBeat + tolerance) {
            const arrow = arrowMap[currentArrowCheck];
            if (!arrow.isOut) {
                this.checkArrowPress(arrow, currentBeat, padstate[arrow.direction], tolerance);
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

    private checkArrowPress(arrow: Arrow, currentBeat: number, padArrowState: ArrowState, tolerance: number) {
        if (arrow.type === ArrowType.Mine) {
            if (!arrow.isPressed && padArrowState === ArrowState.Press) {
                this.mineHit(arrow)
                console.log(`Hit mine at beat ${arrow.beatPosition}.`);
            } else {
                if (currentBeat > arrow.beatPosition + 1) {
                    this.minePassed(arrow)
                    console.log(`Missed mine at beat ${arrow.beatPosition}.`);
                }
            }

        }

        if (arrow.type === ArrowType.Hold && arrow.isPressed) {
            if (arrow.beatEnd !== null && currentBeat > arrow.beatEnd) {
                this.arrowOk(arrow)
                return;
            }

            if (padArrowState !== ArrowState.Hold) {
                arrow.missedFrames--
                if (arrow.missedFrames <= 0)
                    this.arrowMissed(arrow)
            }
            else if (arrow.missedFrames < CONFIG.GAME.MAX_MISSED_FRAME_HOLD)
                arrow.missedFrames++

            return
        }

        if (currentBeat > arrow.beatPosition + (2 * tolerance)) {
            arrow.isMissed = true;
            this.arrowMissed(arrow)
            console.log(`Missed arrow at beat ${arrow.beatPosition}.`);
            return;
        }

        if (padArrowState === ArrowState.Press) {
            if (currentBeat > arrow.beatPosition + tolerance) {
                this.arrowAlmost(arrow)
                console.log(`Almost arrow at beat ${arrow.beatPosition}.`);
                return
            }
            const difference = Math.abs(arrow.beatPosition - currentBeat);

            if (difference <= tolerance * 0.25) {
                // Perfect: Very close to the beat
                this.arrowPerfect(arrow);
                console.log(`Perfect arrow at beat ${arrow.beatPosition}.`);
                return;
            } else if (difference <= tolerance * 0.5) {
                // Great: Slightly off but close enough
                this.arrowGreat(arrow);
                console.log(`Great arrow at beat ${arrow.beatPosition}.`);
                return;
            } else if (difference <= tolerance) {
                // Good: Further off but still acceptable
                this.arrowGood(arrow);
                console.log(`Good arrow at beat ${arrow.beatPosition}.`);
                return;
            }
        }
    }

    arrowPerfect(arrow: Arrow) {
        arrow.perfect()
        this.updatePerformance(2);
        this.score += this.scorePerArrow
        this.comboCount++
        this.precisionMessage.push(arrow)
    }
    arrowGreat(arrow: Arrow) {
        arrow.great()
        this.updatePerformance(1);
        this.score += this.scorePerArrow * 0.8
        this.comboCount++
        this.precisionMessage.push(arrow)
    }
    arrowGood(arrow: Arrow) {
        arrow.good()
        this.updatePerformance(1);
        this.score += this.scorePerArrow * 0.6
        this.comboCount++
        this.precisionMessage.push(arrow)
    }
    arrowAlmost(arrow: Arrow) {
        arrow.almost()
        this.updatePerformance(- 3);
        this.score += this.scorePerArrow * 0.2
        this.comboCount = 0
        this.precisionMessage.push(arrow)
    }
    arrowMissed(arrow: Arrow) {
        arrow.missed()
        this.updatePerformance(-4)
        this.comboCount = 0
        this.precisionMessage.push(arrow)
    }
    arrowOk(arrow: Arrow) {
        arrow.ok();
        const arrowLength = arrow.beatEnd! - arrow.beatPosition
        this.performance = Math.min(100, this.performance + arrowLength);
        this.score += arrowLength * this.scorePerHoldBeat
        this.precisionMessage.push(arrow)
    }
    mineHit(arrow: Arrow) {
        arrow.boom()
        this.updatePerformance(-20)
        this.comboCount = 0
        this.precisionMessage.push(arrow)
        this.soundManager.playMineHit();
    }
    minePassed(arrow: Arrow) {
        arrow.ok()
    }

    updatePerformance(amount: number): void {
        if (this.isTrainingMode || this.isFailed)
            return

        this.performance += amount;

        if (this.performance > 100)
            this.performance = 100;
        else if (this.performance < 0)
            this.performance = 0;

    }

    EndFail() {
        this.isFailed = true
        this.performance = 1
    }
    EndVictory() {
        if (this.isFailed) return
        this.isFinished = true;
    }
}
