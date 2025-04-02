import { ArrowColor } from "../player-display/arrowImageManager";
import { ArrowDirection } from "src/app/game/constants/arrow-direction.enum";
import { ArrowType } from "../constants/arrow-type.enum";
import { CONFIG } from "../constants/game-config";
import { Precision } from "../constants/precision.enum";

export class Arrow {
    direction: ArrowDirection;
    type: ArrowType;
    beatPosition: number;
    beatEnd: number | null;
    color: ArrowColor;

    isValid: boolean = false;
    isPerfect: boolean = false;
    isMissed: boolean = false;

    precision: Precision | null = null;

    isPressed: boolean = false;
    missedFrames: number = CONFIG.GAME.MAX_MISSED_FRAME_HOLD;

    constructor(direction: ArrowDirection, beatPosition: number, type: ArrowType = ArrowType.Tap, beatEnd: number | null = null) {
        this.direction = direction
        this.beatPosition = beatPosition
        this.type = type
        this.beatEnd = beatEnd
        this.color = Arrow.determineArrowColor(beatPosition)
    }

    public get isOut(): boolean {
        return this.isValid || this.isMissed
    }

    public perfect() {
        if (this.isTypeHold)
            this.isPressed = true;
        else
            this.precision = Precision.Perfect
    }
    public great() {
        if (this.isTypeHold)
            this.isPressed = true;
        else
            this.isValid = true
        this.precision = Precision.Great
    }
    public good() {
        if (this.isTypeHold)
            this.isPressed = true;
        else
            this.isValid = true

        this.precision = Precision.Good
    }
    public almost() {
        if (this.isTypeHold)
            this.isPressed = true;
        else
            this.isMissed = true

        this.precision = Precision.Almost
    }
    public missed() {
        this.isMissed = true
        this.precision = Precision.Missed
    }
    public ok() {
        this.isValid = true
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


    public get isTypeHold(): Boolean {
        return this.type === ArrowType.Hold
    }

}
