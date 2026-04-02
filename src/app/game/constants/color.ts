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

    static gradeFromScore(score: number, failed: boolean): { grade: string, color: string } {
        if (!failed) {
            if (score >= 1000000) return { grade: 'S', color: '#FFFAAA' };
            if (score >= 980000) return { grade: 'AAA', color: '#89adf6' };
            if (score >= 950000) return { grade: 'AA', color: '#2a6aea' };
            if (score >= 900000) return { grade: 'A', color: '#2037f8' };
            if (score >= 800000) return { grade: 'B', color: '#32CD32' };
            if (score >= 700000) return { grade: 'C', color: '#FFA500' };
            if (score >= 600000) return { grade: 'D', color: '#FF0000' };
        }
        return { grade: 'E', color: '#808080' };
    }



}
