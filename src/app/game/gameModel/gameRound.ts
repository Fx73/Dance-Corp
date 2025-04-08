import { ArrowState, DancePadInput, IDancePad } from "../gameController/dancepad.interface";
import { MusicDto, NoteDataDto } from "./music.dto";

import { Arrow } from "./arrow";
import { ArrowDirection } from 'src/app/game/constants/arrow-direction.enum';
import { ArrowType } from "../constants/arrow-type.enum";
import { CONFIG } from './../constants/game-config';
import { DancePadGamepad } from "../gameController/dancepad-gamepad";
import { DancePadKeyboard } from './../gameController/dancepad-keyboard';
import { Player } from "./player";
import { Precision } from "../constants/precision.enum";

export class GameRound {
    //#region App Constants
    readonly ArrowDirection = ArrowDirection;
    readonly MAX_SCORE = 1000000;
    //#endregion

    //Game Data
    arrowMap: Arrow[] = []; // Map of the complete game
    music: MusicDto;
    bps: number; // Beat Per Second (BPM/60)
    tolerance: number; //In beat

    //Player Data
    public player: Player
    dancepad: IDancePad

    //Game variables
    private isTrainingMode = false;
    public score: number = 0;
    public performance: number = 50;
    public currentBeat: number = 0
    public currentArrowIndex: number = 0; // Tracks the last note out of game
    public isFailed = false;
    public isFinished = false;
    public comboCount: number = 0;
    public grade: string = ""; // A, B, C, D, E

    private scorePerArrow: number = 0;
    private scorePerHoldBeat: number = 0;

    //Display consuming
    precisionMessage: Arrow[] = []; // Message to display on the screen


    constructor(musicDTO: MusicDto, notes: NoteDataDto, player: Player, isTrainingMode = false) {
        this.player = player
        this.music = musicDTO;
        this.bps = musicDTO.bpms[0].value / 60
        this.tolerance = CONFIG.GAME.TOLERANCE_WINDOW * this.bps;

        if (player.gamepad!.index! === -1)
            this.dancepad = new DancePadKeyboard(player.keyBindingKeyboard)
        else
            this.dancepad = new DancePadGamepad(player.gamepad!.index!, player.keyBindingGamepad)
        this.loadArrows(notes)
        this.calculateScore()

        if (isTrainingMode) {
            this.isTrainingMode = true
            this.performance = 100
        }

    }


    private loadArrows(notes: NoteDataDto): void {
        const activeHolds: (Arrow | null)[] = Array(Object.values(ArrowDirection).length).fill(null);

        for (let measureIndex = 0; measureIndex < notes.stepChart.length; measureIndex++) {
            const measure = notes.stepChart[measureIndex];
            const beatPrecision = measure.steps.length / CONFIG.GAME.BEAT_PER_MEASURE;

            for (let stepIndex = 0; stepIndex < measure.steps.length; stepIndex++) {
                const stepRow = measure.steps[stepIndex];
                const beatPosition = (measureIndex * CONFIG.GAME.BEAT_PER_MEASURE) + (stepIndex / beatPrecision);

                for (let direction = 0; direction < stepRow.length; direction++) {
                    const stepValue = stepRow[direction];

                    if (stepValue === 1) { // Tap
                        this.arrowMap.push(new Arrow(direction, beatPosition));

                    } else if (stepValue === 2) { // Hold
                        const newArrow = new Arrow(direction, beatPosition, ArrowType.Hold);
                        activeHolds[direction] = newArrow;
                        this.arrowMap.push(newArrow);

                    } else if (stepValue === 3 && activeHolds[direction]) { // Continue Hold
                        activeHolds[direction]!.beatEnd = beatPosition;
                    }

                }
            }
        }
    }


    private calculateScore() {
        const holdArrows = this.arrowMap.filter(arrow => arrow.isTypeHold)

        // Calculate total hold percentage for score
        const totalHoldTime = holdArrows.reduce((total, arrow) => total + (arrow.beatEnd!) - arrow.beatPosition, 0);
        const totalDanceTime = this.arrowMap[this.arrowMap.length - 1].beatEnd ?? this.arrowMap[this.arrowMap.length - 1].beatPosition;
        const holdPercentage = totalHoldTime / totalDanceTime;

        // Point attribution
        const holdPoints = (this.MAX_SCORE / 2) * holdPercentage;
        const arrowPoints = 1000000 - holdPoints;

        this.scorePerArrow = arrowPoints / this.arrowMap.length;
        this.scorePerHoldBeat = holdPoints / totalHoldTime;


    }


    public gameLoop(elapsedTime: number): void {
        this.currentBeat = elapsedTime * this.bps

        // Get DancePad state
        const padstate = this.dancepad.getRefreshedState()

        if (this.isFinished)
            return

        // Check arrows
        let currentArrowCheck = this.currentArrowIndex
        while (currentArrowCheck < this.arrowMap.length && this.arrowMap[currentArrowCheck].beatPosition < this.currentBeat + this.tolerance) {
            const arrow = this.arrowMap[currentArrowCheck];
            if (!arrow.isOut) {
                this.checkArrowPress(arrow, this.currentBeat, padstate[arrow.direction])
            }
            currentArrowCheck++
        }


        // Pass out arrows
        while (this.arrowMap[this.currentArrowIndex].isOut) {
            this.currentArrowIndex++
            if (this.currentArrowIndex >= this.arrowMap.length) {
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

    private checkArrowPress(arrow: Arrow, currentBeat: number, padArrowState: ArrowState) {
        if (arrow.isTypeHold && arrow.isPressed) {
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

        if (currentBeat > arrow.beatPosition + (2 * this.tolerance)) {
            arrow.isMissed = true;
            this.arrowMissed(arrow)
            console.log(`Missed arrow at beat ${arrow.beatPosition}.`);
            return;
        }

        if (padArrowState === ArrowState.Press) {
            if (currentBeat > arrow.beatPosition + this.tolerance) {
                this.arrowAlmost(arrow)
                console.log(`Almost arrow at beat ${arrow.beatPosition}.`);
                return
            }
            const difference = Math.abs(arrow.beatPosition - currentBeat);

            if (difference <= this.tolerance * 0.25) {
                // Perfect: Very close to the beat
                this.arrowPerfect(arrow);
                console.log(`Perfect arrow at beat ${arrow.beatPosition}.`);
                return;
            } else if (difference <= this.tolerance * 0.5) {
                // Great: Slightly off but close enough
                this.arrowGreat(arrow);
                console.log(`Great arrow at beat ${arrow.beatPosition}.`);
                return;
            } else if (difference <= this.tolerance) {
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
        this.isFinished = true;
        this.grade = "B"
    }
}
