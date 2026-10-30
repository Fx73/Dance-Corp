import { BpmChange, StopChange } from "src/app/game/game-model/timeline/timedChange"
import { describe, expect, it } from "vitest"

import { BeatManager } from "src/app/game/game-model/timeline/beatManager"
import { MusicDto } from "src/app/game/game-model/music.dto"

function CreateBeatManager(bpms: BpmChange[], stops: StopChange[] = [], offset: number = 0): BeatManager {
  const music = new MusicDto()
  music.bpms = bpms
  music.stops = stops
  music.offset = offset
  return new BeatManager(music)
}

describe("BeatManager", () => {
  describe("constant BPM", () => {
    const beatManager = CreateBeatManager([new BpmChange(0, 120)])

    it("advances 2 beats per second at 120 BPM", () => {
      expect(beatManager.GetBeatAtTime(0)).toBe(0)
      expect(beatManager.GetBeatAtTime(1)).toBe(2)
      expect(beatManager.GetBeatAtTime(10.25)).toBe(20.5)
    })

    it("counts negative beats before the start", () => {
      expect(beatManager.GetBeatAtTime(-1)).toBe(-2)
    })

    it("gives the beats per second", () => {
      expect(beatManager.GetBpsAtTime(5)).toBe(2)
    })
  })

  describe("BPM changes", () => {
    // 8 beats at 120 BPM (4 s), then 240 BPM
    const beatManager = CreateBeatManager([new BpmChange(0, 120), new BpmChange(8, 240)])

    it("reaches the change at the right time", () => {
      expect(beatManager.GetBeatAtTime(4)).toBe(8)
    })

    it("follows the new BPM after the change", () => {
      expect(beatManager.GetBeatAtTime(5)).toBe(12)
      expect(beatManager.GetBpsAtTime(5)).toBe(4)
    })

    it("accepts unsorted changes", () => {
      const unsorted = CreateBeatManager([new BpmChange(8, 240), new BpmChange(0, 120)])
      expect(unsorted.GetBeatAtTime(5)).toBe(12)
    })
  })

  describe("stops", () => {
    // Beat 4 reached at 2 s, frozen for 0.5 s
    const beatManager = CreateBeatManager([new BpmChange(0, 120)], [new StopChange(4, 0.5)])

    it("freezes the beat during the stop", () => {
      expect(beatManager.GetBeatAtTime(2)).toBe(4)
      expect(beatManager.GetBeatAtTime(2.4)).toBe(4)
    })

    it("keeps the previous beats per second during the stop", () => {
      expect(beatManager.GetBpsAtTime(2.2)).toBe(2)
    })

    it("resumes after the stop, shifted by its duration", () => {
      expect(beatManager.GetBeatAtTime(3)).toBe(5)
    })

    it("applies a stop before a BPM change on the same beat", () => {
      const both = CreateBeatManager([new BpmChange(0, 120), new BpmChange(8, 240)], [new StopChange(8, 0.5)])
      expect(both.GetBeatAtTime(4.25)).toBe(8)
      expect(both.GetBeatAtTime(5.5)).toBe(12)
    })
  })

  describe("offset", () => {
    it("starts beat 0 later with a negative offset", () => {
      const beatManager = CreateBeatManager([new BpmChange(0, 120)], [], -0.1)
      expect(beatManager.GetBeatAtTime(0)).toBeCloseTo(-0.2)
      expect(beatManager.GetBeatAtTime(0.1)).toBeCloseTo(0)
      expect(beatManager.GetBeatAtTime(1.1)).toBeCloseTo(2)
    })

    it("starts after beat 0 with a positive offset", () => {
      const beatManager = CreateBeatManager([new BpmChange(0, 120)], [], 0.5)
      expect(beatManager.GetBeatAtTime(0)).toBeCloseTo(1)
      expect(beatManager.GetBeatAtTime(1)).toBeCloseTo(3)
    })

    it("shifts the stops with the offset", () => {
      const beatManager = CreateBeatManager([new BpmChange(0, 120)], [new StopChange(4, 0.5)], -0.1)
      expect(beatManager.GetBeatAtTime(2.3)).toBeCloseTo(4)
      expect(beatManager.GetBeatAtTime(3.1)).toBeCloseTo(5)
    })
  })

  describe("GetBeatAndBpsAtTime", () => {
    const beatManager = CreateBeatManager([new BpmChange(0, 120), new BpmChange(8, 240)], [new StopChange(4, 0.5)])

    it("matches GetBeatAtTime and GetBpsAtTime", () => {
      for (const time of [-1, 0, 1.5, 2.2, 3, 4.5, 6, 20]) {
        expect(beatManager.GetBeatAndBpsAtTime(time)).toEqual({
          beat: beatManager.GetBeatAtTime(time),
          bps: beatManager.GetBpsAtTime(time),
        })
      }
    })
  })
})
