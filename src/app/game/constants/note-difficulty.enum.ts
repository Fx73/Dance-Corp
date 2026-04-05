export enum NoteDifficulty {
    Beginner = "Beginner",
    Basic = "Easy",
    Difficult = "Advanced",
    Expert = "Expert",
    Challenge = "Challenge"
}
export const difficultyMap: Record<string, NoteDifficulty> = {
    // Beginner
    "beginner": NoteDifficulty.Beginner,
    "novice": NoteDifficulty.Beginner,

    // Basic / Easy
    "easy": NoteDifficulty.Basic,
    "light": NoteDifficulty.Basic,

    // Difficult / Advanced
    "medium": NoteDifficulty.Difficult,
    "advanced": NoteDifficulty.Difficult,
    "difficult": NoteDifficulty.Difficult,

    // Expert
    "expert": NoteDifficulty.Expert,
    "hard": NoteDifficulty.Expert,

    // Challenge
    "challenge": NoteDifficulty.Challenge,
    "edit": NoteDifficulty.Challenge
};
