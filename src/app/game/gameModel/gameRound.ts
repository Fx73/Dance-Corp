import { ArrowState, DancePad } from "./dancepad";
import { MusicDto, NotesDto } from "../dto/music.dto";

import { Arrow } from "./arrow";
import { ArrowDirection } from "../../shared/enumeration/arrow-direction.enum";
import { Player } from "../dto/player";

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
    score: number = 0;
    performance: number = 50;
    dancepad: DancePad


    //Private
    private zeroTimeStamp: DOMHighResTimeStamp = 0;
    private currentArrowIndex: number = 0; // Tracks the last note out of game

    constructor(musicDTO: MusicDto, notes: NotesDto, players: Player[]) {
        this.music = musicDTO;
        this.bps = musicDTO.bpms[0].bpm / 60
        this.tolerance = this.TOLERANCE_WINDOW * this.bps;

        this.dancepad = new DancePad(players[0].gamepad!.index!)
        this.loadArrows(notes)
    }

    private loadArrows(notes: NotesDto): void {
        for (let measureIndex = 0; measureIndex < notes.stepChart.length; measureIndex++) {
            const measure = notes.stepChart[measureIndex];

            for (let stepIndex = 0; stepIndex < measure.steps.length; stepIndex++) {
                const stepRow = measure.steps[stepIndex];

                // Iterate through the columns to identify active steps
                for (let columnIndex = 0; columnIndex < stepRow.length; columnIndex++) {
                    if (stepRow[columnIndex] === 1) {  // "Press" arrow
                        const direction = this.getDirectionFromColumn(columnIndex);
                        const beatPosition = measureIndex * this.BEAT_PER_MEASURE + (stepIndex / (stepRow.length / this.BEAT_PER_MEASURE))
                        this.arrowMap.push(new Arrow(direction, beatPosition));
                    }
                }
            }
        }
    }

    private getDirectionFromColumn(columnIndex: number): ArrowDirection {
        switch (columnIndex) {
            case 0: return ArrowDirection.Left;
            case 1: return ArrowDirection.Down;
            case 2: return ArrowDirection.Up;
            case 3: return ArrowDirection.Right;
            default: throw new Error(`Unknown column index: ${columnIndex}`);
        }
    }


    startGame(): void {
        this.zeroTimeStamp = performance.now();
        this.gameLoop(this.zeroTimeStamp); // Begin the loop with the current timestamp
    }


    private gameLoop(currentTimestamp: DOMHighResTimeStamp): void {
        const elapsedTime = (currentTimestamp - this.zeroTimeStamp) / 1000; // In seconds
        const currentBeat = elapsedTime / this.bps

        // Get DancePad state
        let padState = this.dancepad.getState()

        // Check arrows
        let currentArrowCheck = this.currentArrowIndex
        while (this.arrowMap[currentArrowCheck].beatPosition < currentBeat + this.tolerance) {
            const arrow = this.arrowMap[currentArrowCheck];
            if (!arrow.isOut) {
                this.checkArrowPress(arrow, currentBeat, padState[arrow.direction])
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

        // Schedule the next loop iteration
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    private checkArrowPress(arrow: Arrow, currentBeat: number, padArrowState: ArrowState) {
        if (currentBeat > arrow.beatPosition + (2 * this.tolerance)) {
            arrow.isOut = true;
            this.arrowMissed()
            console.log(`Missed arrow at beat ${arrow.beatPosition}.`);
            return
        }

        if (padArrowState === ArrowState.Press) {
            if (currentBeat > arrow.beatPosition + this.tolerance) {
                arrow.isOut = true;
                this.arrowAlmost()
                console.log(`Almost hit arrow at beat ${arrow.beatPosition}.`);
                return
            }
            const difference = Math.abs(arrow.beatPosition - currentBeat);

            if (difference <= this.tolerance * 0.25) {
                // Perfect: Very close to the beat
                arrow.isOut = true;
                this.arrowPerfect();
                console.log(`Perfect hit arrow at beat ${arrow.beatPosition}.`);
                return;
            } else if (difference <= this.tolerance * 0.5) {
                // Great: Slightly off but close enough
                arrow.isOut = true;
                this.arrowGreat();
                console.log(`Great hit arrow at beat ${arrow.beatPosition}.`);
                return;
            } else if (difference <= this.tolerance) {
                // Good: Further off but still acceptable
                arrow.isOut = true;
                this.arrowGood();
                console.log(`Good hit arrow at beat ${arrow.beatPosition}.`);
                return;
            }
        }
    }

    arrowPerfect() {
        this.performance = Math.min(100, this.performance + 2);
        this.score += 4
    }
    arrowGreat() {
        this.performance = Math.min(100, this.performance + 1);
        this.score += 3
    }
    arrowGood() {
        this.performance = Math.min(100, this.performance + 1);
        this.score += 2
    }
    arrowAlmost() {
        this.performance = Math.max(0, this.performance - 5);
        this.score += 1
    }
    arrowMissed() {
        this.performance = Math.max(0, this.performance - 10);
    }


    EndFail() {
        console.log("FAIL")
    }
    EndVictory() {
        console.log("VICTORY")
    }
}
