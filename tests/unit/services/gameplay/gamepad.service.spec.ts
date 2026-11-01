import { GamepadService, GamepadStatus } from "src/app/services/gameplay/gamepad.service"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { NativeGamepadService } from "src/app/services/thirdpartyapp/native-gamepad.service"
import { Player } from "src/app/game/game-model/player"
import { Subject } from "rxjs"
import { TestBed } from "@angular/core/testing"
import { UserConfigService } from "src/app/services/userconfig.service"

describe("GamepadService", () => {
  let gamepads: (Gamepad | null)[]
  let isPlugged: boolean | null

  beforeEach(() => {
    gamepads = []
    isPlugged = null
    vi.stubGlobal("navigator", { ...navigator, getGamepads: () => gamepads })
    TestBed.configureTestingModule({
      providers: [
        { provide: UserConfigService, useValue: { players: [] } },
        { provide: NativeGamepadService, useValue: { connected: new Subject(), IsPlugged: () => isPlugged } },
      ],
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function Status(gamepadId: string): GamepadStatus {
    return TestBed.inject(GamepadService).GetStatus(gamepadId)
  }

  it("gives the keyboard and the gamepads seen by the webview as active", () => {
    gamepads = [{ id: "pad", index: 0 } as Gamepad]
    expect(Status(Player.KEYBOARD_ID)).toBe(GamepadStatus.Active)
    expect(Status("pad")).toBe(GamepadStatus.Active)
  })

  it("tells, from the system, whether a gamepad not seen yet is plugged in", () => {
    isPlugged = true
    expect(Status("pad")).toBe(GamepadStatus.Plugged)
    isPlugged = false
    expect(Status("pad")).toBe(GamepadStatus.Unplugged)
    isPlugged = null
    expect(Status("pad")).toBe(GamepadStatus.Unknown)
  })
})
