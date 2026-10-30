import { Measures, NoteDataDto } from "src/app/game/game-model/music.dto"
import { describe, expect, it } from "vitest"

import { ArrowColor } from "src/app/game/game-display/arrowImageManager"
import { ArrowDirection } from "src/app/game/constants/arrow-direction.enum"
import { ArrowManager } from "src/app/game/game-model/arrows/arrowManager"
import { ArrowType } from "src/app/game/constants/arrow-type.enum"

// Each measure is written as rows of digits, like in a chart file
function CreateArrowManager(...measures: string[][]): ArrowManager {
  const notes = new NoteDataDto()
  notes.stepChart = measures.map(rows => {
    const measure = new Measures()
    measure.steps = rows.map(row => row.split("").map(Number))
    return measure
  })
  return new ArrowManager(notes)
}

describe("ArrowManager", () => {
  it("places the rows of a 4-row measure on each beat", () => {
    const manager = CreateArrowManager(["1000", "0100", "0010", "0001"])
    expect(manager.arrowMap.map(a => [a.direction, a.beatPosition])).toEqual([
      [ArrowDirection.Left, 0], [ArrowDirection.Down, 1], [ArrowDirection.Up, 2], [ArrowDirection.Right, 3],
    ])
  })

  it("places the measures 4 beats apart, whatever their row count", () => {
    const manager = CreateArrowManager(["1000", "0000", "0000", "0000"], ["0000", "0001", "0000", "0000", "0000", "0000", "0000", "0000"])
    expect(manager.arrowMap.map(a => a.beatPosition)).toEqual([0, 4.5])
  })

  it("creates one arrow per direction on a jump", () => {
    const manager = CreateArrowManager(["1001", "0000", "0000", "0000"])
    expect(manager.arrowMap.map(a => a.direction)).toEqual([ArrowDirection.Left, ArrowDirection.Right])
  })

  it("ends a hold on its tail", () => {
    const manager = CreateArrowManager(["2000", "0000", "0000", "0000"], ["3000", "0000", "0000", "0000"])
    const hold = manager.arrowMap[0]
    expect(hold.type).toBe(ArrowType.Hold)
    expect(hold.beatEnd).toBe(4)
    expect(hold.holdLength).toBe(4)
  })

  it("ends a hold without tail on the next row", () => {
    const manager = CreateArrowManager(["0000", "0000", "0000", "0000", "0000", "0000", "2000", "0000"])
    expect(manager.arrowMap[0].beatEnd).toBe(3.5)
  })

  it("plays a roll as a hold", () => {
    const manager = CreateArrowManager(["0400", "0300", "0000", "0000"])
    expect(manager.arrowMap[0].type).toBe(ArrowType.Hold)
    expect(manager.arrowMap[0].beatEnd).toBe(1)
  })

  it("creates the mines, and ignores the fake, hidden and minefield notes", () => {
    const manager = CreateArrowManager(["5000", "0600", "0070", "0008"])
    expect(manager.arrowMap).toHaveLength(1)
    expect(manager.arrowMap[0].type).toBe(ArrowType.Mine)
    expect(manager.arrowMap[0].holdLength).toBe(0)
  })

  it("colors the arrows by their place in the beat", () => {
    const manager = CreateArrowManager(Array.from({ length: 12 }, () => "1000"), Array.from({ length: 16 }, () => "1000"))
    const colorAt = (beat: number) => manager.arrowMap.find(a => a.beatPosition === beat)?.color
    expect(colorAt(1)).toBe(ArrowColor.Orange)
    expect(colorAt(4.5)).toBe(ArrowColor.Blue)
    expect(colorAt(4.25)).toBe(ArrowColor.Yellow)
    expect(colorAt(1 / 3)).toBe(ArrowColor.Violet)
  })
})
