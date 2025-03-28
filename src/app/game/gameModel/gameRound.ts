import { ArrowState, DancePadInput, IDancePad } from "../gameController/dancepad.interface";
import { MusicDto, NotesDto } from "../dto/music.dto";

import { Arrow } from "./arrow";
import { ArrowDirection } from "../../shared/enumeration/arrow-direction.enum";
import { ArrowType } from "../constants/arrow-type.enum";
import { CONFIG } from "../constants/game-config";
import { DancePadGamepad } from "../gameController/dancepad-gamepad";
import { DancePadKeyboard } from './../gameController/dancepad-keyboard';
import { Player } from "../dto/player";
import { Precision } from "../constants/precision.enum";

export class GameRound {
    //#region App Constants
    readonly BEAT_PER_MEASURE = 4;
    readonly TOLERANCE_WINDOW = 0.2; //In seconds
    readonly ArrowDirection = ArrowDirection;
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
    public score: number = 0;
    public performance: number = 50;
    public currentBeat: number = 0
    public currentArrowIndex: number = 0; // Tracks the last note out of game

    //Display consuming
    precisionMessage: Precision | null = null;


    constructor(musicDTO: MusicDto, notes: NotesDto, player: Player) {
        this.player = player
        this.music = musicDTO;
        this.bps = musicDTO.bpms[0].bpm / 60
        this.tolerance = this.TOLERANCE_WINDOW * this.bps;

        if (player.gamepad!.index! === -1)
            this.dancepad = new DancePadKeyboard(player.keyBindingKeyboard)
        else
            this.dancepad = new DancePadGamepad(player.gamepad!.index!, player.keyBindingGamepad)
        this.loadArrows(notes)
    }


    private loadArrows(notes: NotesDto): void {
        const activeHolds: (Arrow | null)[] = Array(Object.values(ArrowDirection).length).fill(null);

        for (let measureIndex = 0; measureIndex < notes.stepChart.length; measureIndex++) {
            const measure = notes.stepChart[measureIndex];
            const beatPrecision = measure.steps.length / this.BEAT_PER_MEASURE;

            for (let stepIndex = 0; stepIndex < measure.steps.length; stepIndex++) {
                const stepRow = measure.steps[stepIndex];
                const beatPosition = (measureIndex * this.BEAT_PER_MEASURE) + (stepIndex / beatPrecision);

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


    public gameLoop(elapsedTime: number): void {
        this.currentBeat = elapsedTime * this.bps

        // Get DancePad state
        const padstate = this.dancepad.getRefreshedState()

        // Check arrows
        let currentArrowCheck = this.currentArrowIndex
        while (this.arrowMap[currentArrowCheck].beatPosition < this.currentBeat + this.tolerance) {
            const arrow = this.arrowMap[currentArrowCheck];
            if (!arrow.isOut) {
                this.checkArrowPress(arrow, this.currentBeat, padstate[arrow.direction])
            }
            currentArrowCheck++
        }

        //Check Fail
        if (this.performance <= 0) {
            this.EndFail()
            return
        }

        // Pass out arrows
        while (this.arrowMap[this.currentArrowIndex].isOut) {
            this.currentArrowIndex++
            if (this.currentArrowIndex >= this.arrowMap.length) {
                this.EndVictory()
                return
            }
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
                return
            }
            const difference = Math.abs(arrow.beatPosition - currentBeat);

            if (difference <= this.tolerance * 0.25) {
                // Perfect: Very close to the beat
                this.arrowPerfect(arrow);
                return;
            } else if (difference <= this.tolerance * 0.5) {
                // Great: Slightly off but close enough
                this.arrowGreat(arrow);
                return;
            } else if (difference <= this.tolerance) {
                // Good: Further off but still acceptable
                this.arrowGood(arrow);
                return;
            }
        }
    }

    arrowPerfect(arrow: Arrow) {
        if (arrow.isTypeHold)
            arrow.isPressed = true;
        else
            arrow.isPerfect = true
        this.performance = Math.min(100, this.performance + 2);
        this.score += 4
        this.precisionMessage = Precision.Perfect
    }
    arrowGreat(arrow: Arrow) {
        if (arrow.isTypeHold)
            arrow.isPressed = true;
        else
            arrow.isValid = true
        this.performance = Math.min(100, this.performance + 1);
        this.score += 3
        this.precisionMessage = Precision.Great
    }
    arrowGood(arrow: Arrow) {
        if (arrow.isTypeHold)
            arrow.isPressed = true;
        else
            arrow.isValid = true
        this.performance = Math.min(100, this.performance + 1);
        this.score += 2
        this.precisionMessage = Precision.Good
    }
    arrowAlmost(arrow: Arrow) {
        if (arrow.isTypeHold)
            arrow.isPressed = true;
        else
            arrow.isMissed = true
        this.performance = Math.max(0, this.performance - 5);
        this.score += 1
        this.precisionMessage = Precision.Almost
    }
    arrowMissed(arrow: Arrow) {
        arrow.isMissed = true;
        this.performance = Math.max(0, this.performance - 10);
        this.precisionMessage = Precision.Missed
    }
    arrowOk(arrow: Arrow) {
        arrow.isValid = true;
        const arrowLength = arrow.beatEnd ? Math.round(arrow.beatEnd - arrow.beatPosition) : 1
        this.performance = Math.min(100, this.performance + arrowLength);
        this.score += arrowLength / 2
        this.precisionMessage = Precision.Ok
        console.log("OK ARROW")
    }

    EndFail() {
        console.log("FAIL")
    }
    EndVictory() {
        console.log("VICTORY")
    }
}
