import { ArrowColor } from "../player-display/arrowImageManager";
import { ArrowDirection } from "src/app/shared/enumeration/arrow-direction.enum";

export class Arrow {
    direction: ArrowDirection;
    beatPosition: number;
    color: ArrowColor;

    isValid: boolean = false;
    isMissed: boolean = false;

    constructor(direction: ArrowDirection, beatPosition: number) {
        this.direction = direction;
        this.beatPosition = beatPosition;
        this.color = Arrow.determineArrowColor(beatPosition)
    }

    public get isOut(): boolean {
        return this.isValid || this.isMissed
    }

    private static determineArrowColor(beat: number): ArrowColor {
        if (beat % 1 === 0) {
            return ArrowColor.Orange; // On the beat
        } else if (beat % 0.5 === 0) {
            return ArrowColor.Blue; // Half beat
        } else if (beat % 0.25 === 0) {
            return ArrowColor.Yellow; // Quarter beat
        } else {
            return ArrowColor.Violet; // Otherwise
        }
    }
}
