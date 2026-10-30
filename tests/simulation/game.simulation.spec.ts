import { CreateChart, CreateMusic, Input, PerfectInputs, Simulate, TimeOfBeat } from "./simulator"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ArrowDirection } from "src/app/game/constants/arrow-direction.enum"
import { CONFIG } from "src/app/game/constants/game-config"
import { Precision } from "src/app/game/constants/precision.enum"

// 4ths, 8ths and jumps on every direction
const MIXED_CHART = CreateChart(
  ["1000", "0100", "0010", "0001"],
  ["1000", "0000", "0100", "0010", "1001", "0000", "0110", "0000"],
  ["1000", "0100", "0010", "0001"],
)

// One tap per beat on the left arrow
function TapChart(measureCount: number) {
  return CreateChart(...Array.from({ length: measureCount }, () => ["1000", "1000", "1000", "1000"]))
}

function Precisions(arrows: { precision: Precision | null }[]): (Precision | null)[] {
  return arrows.map(arrow => arrow.precision)
}

describe("Game simulation", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance", "setTimeout", "setInterval", "Date"] })
    // jsdom does not play media
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined)
    vi.spyOn(console, "log").mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe("perfect play", () => {
    it("judges every arrow Perfect at a constant BPM, and gives the max score", async () => {
      const music = CreateMusic({ bpms: "0=120" })
      const { round, announcer, userCache } = await Simulate(music, MIXED_CHART, PerfectInputs(music, MIXED_CHART))

      expect(new Set(Precisions(round.arrowManager.arrowMap))).toEqual(new Set([Precision.Perfect]))
      expect(round.isFinished).toBe(true)
      expect(round.comboCount).toBe(round.arrowManager.arrowMap.length)
      expect(round.score).toBeCloseTo(CONFIG.SCORE.MAX, 3)
      expect(announcer.PlayAnnouncer).toHaveBeenCalledWith("victory")
      expect(userCache.UpdateUserStatsFromRound).toHaveBeenCalledTimes(1)
    })

    it("stays Perfect through BPM changes, stops and an offset", async () => {
      const music = CreateMusic({ bpms: "0=120,4=180,8=90", stops: "6=0.5,10=0.25", offset: -0.3 })
      const { round } = await Simulate(music, MIXED_CHART, PerfectInputs(music, MIXED_CHART))

      expect(new Set(Precisions(round.arrowManager.arrowMap))).toEqual(new Set([Precision.Perfect]))
      expect(round.isFinished).toBe(true)
    })

    it("stays Perfect with a positive offset", async () => {
      const music = CreateMusic({ bpms: "0=150", offset: 0.4 })
      // Beat 0 is before the music starts: the chart begins on the second measure
      const chart = CreateChart(["0000", "0000", "0000", "0000"], ...MIXED_CHART.stepChart.map(m => m.steps.map(row => row.join(""))))
      const { round } = await Simulate(music, chart, PerfectInputs(music, chart))

      expect(new Set(Precisions(round.arrowManager.arrowMap))).toEqual(new Set([Precision.Perfect]))
    })

    it("validates the holds kept until their end", async () => {
      const music = CreateMusic({ bpms: "0=120" })
      const chart = CreateChart(["2000", "0000", "0100", "0000"], ["3000", "0000", "0000", "0000"], ["1000", "0000", "0000", "0000"])
      const { round } = await Simulate(music, chart, PerfectInputs(music, chart))

      const hold = round.arrowManager.arrowMap[0]
      expect(hold.precision).toBe(Precision.Perfect)
      expect(hold.isValid).toBe(true)
      expect(hold.isMissed).toBe(false)
      expect(round.isFinished).toBe(true)
    })

    // Known issue: a hold head also scores like a tap, although the taps share the score without it
    it.fails("gives the max score with holds", async () => {
      const music = CreateMusic({ bpms: "0=120" })
      const chart = CreateChart(["2000", "0000", "0100", "0000"], ["3000", "0000", "0000", "0000"], ["1000", "0000", "0000", "0000"])
      const { round } = await Simulate(music, chart, PerfectInputs(music, chart))

      expect(round.score).toBeCloseTo(CONFIG.SCORE.MAX, 3)
    })
  })

  describe("timing windows", () => {
    // The game judges the press on the next frame: up to 16 ms after it.
    // The chart starts on beat 1, so that an early press still happens after the music start
    it.each([
      [0.05, Precision.Great],
      [0.1, Precision.Good],
      [0.2, Precision.Almost],
      [-0.06, Precision.Great],
      [-0.1, Precision.Good],
    ])("judges a press %f s off the beat %s", async (delay, precision) => {
      const music = CreateMusic({ bpms: "0=60" })
      const chart = CreateChart(["0000", "1000", "0000", "1000"])
      const { round } = await Simulate(music, chart, PerfectInputs(music, chart, delay))

      expect(new Set(Precisions(round.arrowManager.arrowMap))).toEqual(new Set([precision]))
    })
  })

  describe("streams", () => {
    it("judges each press on its own arrow, on 16ths on alternating arrows", async () => {
      const music = CreateMusic({ bpms: "0=150" })
      const chart = CreateChart(Array.from({ length: 16 }, (_, i) => i % 2 === 0 ? "1000" : "0001"), ["1000", "0000", "0000", "0000"])
      const { round } = await Simulate(music, chart, PerfectInputs(music, chart))

      expect(new Set(Precisions(round.arrowManager.arrowMap))).toEqual(new Set([Precision.Perfect]))
    })

    // Known issue: a press judges every arrow of its direction in the tolerance window,
    // so with arrows 100 ms apart, one press also takes the next arrow early
    it.fails("judges each press on its own arrow, on 16ths on the same arrow", async () => {
      const music = CreateMusic({ bpms: "0=150" })
      const chart = CreateChart(Array.from({ length: 16 }, (_, i) => i % 4 === 0 ? "1000" : "0000"), Array.from({ length: 16 }, () => "1000"), ["1000", "0000", "0000", "0000"])
      const { round } = await Simulate(music, chart, PerfectInputs(music, chart))

      expect(new Set(Precisions(round.arrowManager.arrowMap))).toEqual(new Set([Precision.Perfect]))
    })
  })

  describe("missing arrows", () => {
    it("misses every arrow without input, and fails the player", async () => {
      const music = CreateMusic({ bpms: "0=240" })
      const { round, announcer } = await Simulate(music, TapChart(8), [])

      expect(round.isFailed).toBe(true)
      expect(round.isFinished).toBe(false)
      expect(round.score).toBe(0)
      expect(announcer.PlayAnnouncer).toHaveBeenCalledWith("game_over")
    })

    it("never fails in training mode, and does not save the stats", async () => {
      const music = CreateMusic({ bpms: "0=240" })
      const { round, userCache } = await Simulate(music, TapChart(8), [], true)

      expect(round.isFailed).toBe(false)
      expect(round.isFinished).toBe(true)
      expect(userCache.UpdateUserStatsFromRound).not.toHaveBeenCalled()
    })

    it("misses a hold released too early", async () => {
      const music = CreateMusic({ bpms: "0=120" })
      const chart = CreateChart(["2000", "0000", "0000", "0000"], ["3000", "0000", "0000", "0000"], ["1000", "0000", "0000", "0000"])
      const inputs: Input[] = [{ time: 0, direction: ArrowDirection.Left, duration: 0.5 }, { time: TimeOfBeat(music, 8), direction: ArrowDirection.Left }]
      const { round } = await Simulate(music, chart, inputs)

      expect(round.arrowManager.arrowMap[0].precision).toBe(Precision.Missed)
    })
  })

  // Known issue: GameRound.CheckArrowPress does not return after the mine checks,
  // so a mine is then judged like a tap: Missed when avoided, Perfect when pressed
  describe("mines", () => {
    const MINE_CHART = CreateChart(["1000", "0500", "0010", "0000"], ["1000", "0000", "0000", "0000"])

    it.fails("lets the mines pass when they are avoided", async () => {
      const music = CreateMusic({ bpms: "0=120" })
      const { round } = await Simulate(music, MINE_CHART, PerfectInputs(music, MINE_CHART))

      const mine = round.arrowManager.arrowMap[1]
      expect(mine.precision).toBeNull()
      expect(round.isFinished).toBe(true)
      expect(round.comboCount).toBe(3)
    })

    it.fails("explodes a mine pressed on its beat, and breaks the combo", async () => {
      const music = CreateMusic({ bpms: "0=120" })
      const inputs = [...PerfectInputs(music, MINE_CHART), { time: TimeOfBeat(music, 1), direction: ArrowDirection.Down }]
      const { round } = await Simulate(music, MINE_CHART, inputs)

      expect(round.arrowManager.arrowMap[1].precision).toBe(Precision.Boom)
      expect(round.comboCount).toBe(2)
      expect(round.performance).toBe(CONFIG.PERFORMANCE.START + 3 * CONFIG.PERFORMANCE.PERFECT + CONFIG.PERFORMANCE.MINE_HIT)
    })
  })
})
