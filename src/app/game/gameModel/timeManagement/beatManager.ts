import { MusicDto } from "../music.dto";

class TimeSection {
    constructor(
        public timeStart: number,   // in seconds
        public beatStart: number,   // beat at timeStart
        public duration: number,    // duration of the section in seconds (until next BPM change)
        public bps: number          // beats per second (in stop, we use previousBps)
    ) { }
}

class BPMSection extends TimeSection {

    constructor(timeStart: number, beatStart: number, duration: number, bps: number) {
        super(timeStart, beatStart, duration, bps);
    }
}

class StopSection extends TimeSection {
    constructor(timeStart: number, beatStart: number, duration: number, previousBps: number) {
        super(timeStart, beatStart, duration, previousBps);
    }
}


export class BeatManager {
    private timeline: TimeSection[] = [];

    constructor(music: MusicDto) {
        const bpms = [...music.bpms].sort((a, b) => a.time - b.time);
        const stops = [...music.stops].sort((a, b) => a.time - b.time);

        let timeline: TimeSection[] = [];

        let bpmIndex = 0;
        let stopIndex = 0;

        let currentTime = 0; // second
        let currentBeat = bpms[bpmIndex].time;
        let currentBps = bpms[bpmIndex].value / 60;

        while (bpmIndex < bpms.length - 1 || stopIndex < stops.length) {

            const nextBpmBeat = bpmIndex < bpms.length - 1 ? bpms[bpmIndex + 1].time : Infinity;
            const nextStopBeat = stopIndex < stops.length ? stops[stopIndex].time : Infinity;

            const nextTimeBeat = Math.min(nextBpmBeat, nextStopBeat);
            const beatDelta = nextTimeBeat - currentBeat;
            const duration = beatDelta / currentBps;
            if (duration > 0) {
                timeline.push(
                    new BPMSection(currentTime, currentBeat, duration, currentBps)
                );
            }

            currentTime += duration;

            // Section Stop if next Stop change is before or equal next BPM
            if (nextStopBeat <= nextBpmBeat) {
                const stop = stops[stopIndex];

                timeline.push(
                    new StopSection(currentTime, stop.time, stop.value, currentBps)
                );

                currentBeat = stop.time;
                currentTime += stop.value;

                stopIndex++;
            }
            // Section BPM if next Bpm change is before  next stop
            else {
                bpmIndex++;
                const bpm = bpms[bpmIndex];
                currentBeat = bpm.time;
                currentBps = bpm.value / 60;
            }

        }

        timeline.push(
            new BPMSection(currentTime, currentBeat, Infinity, currentBps)
        );


        // --- APPLY OFFSET ---
        const offset = music.offset ?? 0;

        if (offset < 0) {
            const first = timeline[0];
            const bps = first.bps;

            const offsetSection = new BPMSection(0, offset * bps, -offset, bps);

            for (const s of timeline) {
                s.timeStart += -offset;
            }

            timeline.unshift(offsetSection);
        }
        if (offset > 0) {
            for (const s of timeline) {
                s.timeStart -= offset;
            }

            timeline = timeline.filter(s => s.timeStart + s.duration > 0);

            const first = timeline[0];
            if (first.timeStart < 0) {
                const delta = -first.timeStart;
                first.timeStart = 0;
                first.beatStart += delta * first.bps;
                first.duration -= delta;
            }
        }

        this.timeline = timeline;
    }


    private findTimeSection(elapsedTime: number): TimeSection {
        let low = 0;
        let high = this.timeline.length - 1;

        if (elapsedTime <= this.timeline[0].timeStart) {
            return this.timeline[0];
        }

        while (low <= high) {
            const mid = (low + high) >> 1;
            const s = this.timeline[mid];

            if (elapsedTime < s.timeStart) {
                high = mid - 1;
            } else if (elapsedTime >= s.timeStart + s.duration) {
                low = mid + 1;
            } else {
                return s;
            }
        }

        return this.timeline[this.timeline.length - 1];
    }


    getBeatAtTime(elapsedTime: number): number {
        const section = this.findTimeSection(elapsedTime);

        if (section instanceof StopSection) {
            return section.beatStart;
        }

        return section.beatStart + (elapsedTime - section.timeStart) * section.bps;
    }

    getBpsAtTime(elapsedTime: number): number {
        const section = this.findTimeSection(elapsedTime);
        return section.bps;
    }

    getBeatAndBpsAtTime(elapsedTime: number): { beat: number; bps: number } {
        const section = this.findTimeSection(elapsedTime);
        if (section instanceof StopSection) {
            return {
                beat: section.beatStart,
                bps: section.bps
            };
        }

        return {
            beat: section.beatStart + (elapsedTime - section.timeStart) * section.bps,
            bps: section.bps
        };
    }

}
