export const CONFIG = {
    APP: {
        DEBUG_MODE: false,
    },
    GAME: {
        BEAT_PER_MEASURE: 4,
        MAX_MISSED_FRAME_HOLD: 8,
        TOLERANCE_WINDOW: 0.15, //In seconds
        DEFAULT_BACKGROUND: "assets/Splash/Texture.png"

    },
    JUDGMENT: {
        PERFECT_WINDOW: 0.25, // Part of the tolerance window
        GREAT_WINDOW: 0.5, // Part of the tolerance window
        MISS_WINDOW: 2, // Tolerance windows after the arrow before it is missed
        MINE_PASS_DELAY: 1, // Beats after a mine before it is passed
    },
    SCORE: {
        MAX: 1000000,
        GREAT_RATIO: 0.8, // Part of the score of an arrow
        GOOD_RATIO: 0.6,
        ALMOST_RATIO: 0.2,
        APPLAUSE_HEAVY_RATIO: 0.9, // Part of the max score (grade A)
    },
    PERFORMANCE: {
        MAX: 100,
        START: 50,
        PERFECT: 2,
        GREAT: 1,
        GOOD: 1,
        ALMOST: -3,
        MISS: -4,
        MINE_HIT: -20,
    },
    ANNOUNCER: {
        COMBO_LINE_THRESHOLD: 30, // Satisfaction above which a combo line plays
        CROWD_FADE_OUT_MS: 4000,
        // Combo count from which the judgment gives more satisfaction
        GREAT_COMBO: 10,
        GOOD_COMBO: 20,
        HOLD_COMBO: 10,
        // Satisfaction gained per judgment
        SATISFACTION: {
            PERFECT: 4,
            GREAT: 4,
            GREAT_IN_COMBO: 2,
            GOOD: 2,
            GOOD_IN_COMBO: 1,
            HOLD: 2,
            HOLD_IN_COMBO: 1,
            ALMOST: 1,
            MISS: 4,
            MINE_HIT: 10,
        },
    },
    DISPLAY: {
        BEAT_INTERVAL: 100, //px
        TARGET_PERCENT: 0.1 // % from top
    },
    PLAYER_COLORS: [
        { stroke: '#2b6cb0', fill: 'rgba(66, 153, 225, 0.30)' },
        { stroke: '#c05621', fill: 'rgba(237, 137, 54, 0.26)' },
        { stroke: '#276749', fill: 'rgba(72, 187, 120, 0.26)' },
        { stroke: '#702459', fill: 'rgba(236, 72, 153, 0.26)' },
    ]
}
