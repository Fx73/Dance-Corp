import { Precision } from "./precision.enum";

export class Color {
    static createGradient(precision: Precision): string {
        switch (precision) {
            case Precision.Perfect: return 'yellow';
            case Precision.Great: return 'green';
            case Precision.Good: return 'blue';
            case Precision.Almost: return 'violet';
            case Precision.Missed: return 'black';
            case Precision.Ok: return 'gold';
            default: return 'gray';
        }
    }
}
