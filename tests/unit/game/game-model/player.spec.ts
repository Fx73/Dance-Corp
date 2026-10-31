import { describe, expect, it } from "vitest"

import { ArrowDirection } from "src/app/game/constants/arrow-direction.enum"
import { Player } from "src/app/game/game-model/player"

// Same round trip as UserConfigService: JSON.stringify to the localStorage, then FromJSON
function Reload(player: Player): Player {
  return Player.FromJSON(JSON.parse(JSON.stringify(player)))
}

describe("Player", () => {
  it("reloads its user, its gamepad and its key bindings", () => {
    const player = new Player()
    player.userId = "uid"
    player.gamepad = { index: 1, id: "pad" }
    player.keyBindingGamepad.set(7, ArrowDirection.Start)
    player.keyBindingKeyboard.set("Enter", ArrowDirection.Start)

    const reloaded = Reload(player)

    expect(reloaded).toBeInstanceOf(Player)
    expect(reloaded.userId).toBe("uid")
    expect(reloaded.gamepad).toEqual({ index: 1, id: "pad" })
    expect(reloaded.keyBindingGamepad).toEqual(player.keyBindingGamepad)
    expect(reloaded.keyBindingKeyboard).toEqual(player.keyBindingKeyboard)
  })

  it("keeps the gamepad buttons as numbers", () => {
    const reloaded = Reload(new Player())
    expect([...reloaded.keyBindingGamepad.keys()]).toEqual([0, 1, 2, 3])
  })

  it("reloads a keyboard player", () => {
    const player = new Player()
    player.gamepad = { index: -1, id: "keyboard" }
    expect(Reload(player).gamepad).toEqual({ index: -1, id: "keyboard" })
  })
})
