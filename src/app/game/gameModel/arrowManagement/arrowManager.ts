import { Arrow } from './arrow';
import { ArrowDirection } from '../../constants/arrow-direction.enum';
import { ArrowType } from '../../constants/arrow-type.enum';
import { CONFIG } from '../../constants/game-config';
import { NoteDataDto } from '../music.dto';

export class ArrowManager {
    arrowMap: Arrow[] = [];

    constructor(notes: NoteDataDto) {
        this.loadArrows(notes);
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

                    switch (stepValue) {

                        case 1: // Tap
                            this.arrowMap.push(new Arrow(direction, beatPosition));
                            break;

                        case 2: { // Hold start
                            const newArrow = new Arrow(direction, beatPosition, ArrowType.Hold);
                            activeHolds[direction] = newArrow;
                            this.arrowMap.push(newArrow);
                            break;
                        }

                        case 3: { // Hold continue
                            const lastHold = activeHolds[direction];
                            if (lastHold) {
                                lastHold.beatEnd = beatPosition;
                            }
                            break;
                        }

                        case 4: { // Roll (treated as hold)
                            const newArrow = new Arrow(direction, beatPosition, ArrowType.Hold);
                            activeHolds[direction] = newArrow;
                            this.arrowMap.push(newArrow);
                            break;
                        }

                        case 5: // Mine
                            this.arrowMap.push(new Arrow(direction, beatPosition, ArrowType.Mine));
                            break;
                    }
                }
            }
        }
    }


}