import { NoteDifficulty } from "./note-difficulty.enum";
import { Precision } from "./precision.enum";

export class Color {
    static precisionGradient(precision: Precision): string {
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


    static noteDifficultyColor(difficulty: NoteDifficulty): string {
        switch (difficulty) {
            case NoteDifficulty.Beginner:
                return 'cyan';
            case NoteDifficulty.Basic:
                return 'orange';
            case NoteDifficulty.Difficult:
                return 'red';
            case NoteDifficulty.Expert:
                return 'limegreen';
            case NoteDifficulty.Challenge:
                return 'mediumvioletred';
        }
    }

}
