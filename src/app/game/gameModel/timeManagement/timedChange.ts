export interface ITimedChange {
    time: number;              // Beat
    value: string | number;    // Payload
}

/* -----------------------------------------
 * BPM Change
 * ----------------------------------------- */
export class BpmChange implements ITimedChange {
    time: number = 0;          // Beat
    value: number = 120;       // BPM

    constructor(time: number, bpm: number) {
        this.time = time;
        this.value = bpm;
    }
}

/* -----------------------------------------
 * STOP Change
 * ----------------------------------------- */
export class StopChange implements ITimedChange {
    time: number = 0;          // Beat
    value: number = 0;         // Duration in seconds

    constructor(time: number, duration: number) {
        this.time = time;
        this.value = duration;
    }
}

/* -----------------------------------------
 * WARP Change (skip beats)
 * ----------------------------------------- */
export class WarpChange implements ITimedChange {
    time: number = 0;          // Beat where warp starts
    value: number = 0;         // Number of beats to skip

    constructor(time: number, beatsToSkip: number) {
        this.time = time;
        this.value = beatsToSkip;
    }
}

/* -----------------------------------------
 * SPEED Change (visual only, scroll speed)
 * ----------------------------------------- */
export class SpeedChange implements ITimedChange {
    time: number = 0;      // Beat
    value: number = 1.0;   // Speed multiplier

    constructor(time: number, multiplier: number) {
        this.time = time;
        this.value = multiplier;
    }
}

/* -----------------------------------------
 * SCROLL Change (visual only, scroll spacement)
 * ----------------------------------------- */
export class ScrollChange implements ITimedChange {
    time: number = 0;      // Beat
    value: number = 1.0;   // Scroll factor

    constructor(time: number, factor: number) {
        this.time = time;
        this.value = factor;
    }
}

/* -----------------------------------------
 * LABEL Change
 * ----------------------------------------- */
export class LabelChange implements ITimedChange {
    time: number = 0;          // Beat
    value: string = "";        // Label text

    constructor(time: number, label: string) {
        this.time = time;
        this.value = label;
    }
}

/* -----------------------------------------
 * BACKGROUND Change
 * ----------------------------------------- */
export class BackgroundChange implements ITimedChange {
    time: number = 0;          // Beat
    value: string = "";        // Path or identifier

    constructor(time: number, path: string) {
        this.time = time;
        this.value = path;
    }
}


