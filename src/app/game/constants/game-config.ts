import { ArrowImageManager } from "../gameDisplay/arrowImageManager";

export const CONFIG = {
    APP: {
        DEBUG_MODE: false,
    },
    GAME: {
        BEAT_PER_MEASURE: 4,
        MAX_MISSED_FRAME_HOLD: 2,
        TOLERANCE_WINDOW: 0.15 //In seconds


    },
    DISPLAY: {
        BEAT_INTERVAL: 100, //px
        TARGET_PERCENT: 0.1 // % from top;
    }
};
