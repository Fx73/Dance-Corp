import { ArrowImageManager } from "../gameDisplay/arrowImageManager";

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
    DISPLAY: {
        BEAT_INTERVAL: 100, //px
        TARGET_PERCENT: 0.1 // % from top;
    },
    PLAYER_COLORS: [
        { stroke: '#2b6cb0', fill: 'rgba(66, 153, 225, 0.30)' },
        { stroke: '#c05621', fill: 'rgba(237, 137, 54, 0.26)' },
        { stroke: '#276749', fill: 'rgba(72, 187, 120, 0.26)' },
        { stroke: '#702459', fill: 'rgba(236, 72, 153, 0.26)' },
    ]
};
