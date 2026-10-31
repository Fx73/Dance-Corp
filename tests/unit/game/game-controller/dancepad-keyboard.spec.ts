import { afterEach, describe, expect, it } from "vitest"

import { ArrowDirection } from "src/app/game/constants/arrow-direction.enum"
import { ArrowState } from "src/app/game/game-controller/dancepad.interface"
import { DancePadKeyboard } from "src/app/game/game-controller/dancepad-keyboard"
import { Player } from "src/app/game/game-model/player"

function Key(type: "keydown" | "keyup", key: string, repeat: boolean = false) {
  window.dispatchEvent(new KeyboardEvent(type, { key, repeat }))
}

describe("DancePadKeyboard", () => {
  let pad: DancePadKeyboard

  afterEach(() => {
    pad.Destroy()
  })

  it("gives a press, then a hold, then nothing once released", () => {
    pad = new DancePadKeyboard(Player.DefaultKeyboardBinding())
    Key("keydown", "ArrowUp")
    expect(pad.GetRefreshedState()[ArrowDirection.Up]).toBe(ArrowState.Press)
    expect(pad.GetRefreshedState()[ArrowDirection.Up]).toBe(ArrowState.Hold)
    Key("keyup", "ArrowUp")
    expect(pad.GetRefreshedState()[ArrowDirection.Up]).toBe(ArrowState.Empty)
  })

  it("ignores the unbound keys and the key repeats", () => {
    pad = new DancePadKeyboard(Player.DefaultKeyboardBinding())
    Key("keydown", "a")
    Key("keydown", "ArrowLeft", true)
    expect(pad.GetRefreshedState()).toEqual([ArrowState.Empty, ArrowState.Empty, ArrowState.Empty, ArrowState.Empty, ArrowState.Empty])
  })

  it("follows its key binding", () => {
    pad = new DancePadKeyboard(new Map([["d", ArrowDirection.Right]]))
    Key("keydown", "d")
    expect(pad.GetRefreshedState()[ArrowDirection.Right]).toBe(ArrowState.Press)
    Key("keyup", "d")
  })

  it("no longer listens to the keyboard once destroyed", () => {
    pad = new DancePadKeyboard(Player.DefaultKeyboardBinding())
    pad.Destroy()
    Key("keydown", "ArrowLeft")
    expect(pad.GetRefreshedState()[ArrowDirection.Left]).toBe(ArrowState.Empty)
  })
})
