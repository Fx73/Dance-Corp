import { ArrowDirection } from "src/app/shared/enumeration/arrow-direction.enum";

export class Arrow {
    direction: ArrowDirection;
    beatPosition: number;

    isOut: boolean = false;

    constructor(direction: ArrowDirection, beatPosition: number) {
        this.direction = direction;
        this.beatPosition = beatPosition;
    }


}
