import { Injectable, NgZone, inject } from '@angular/core'

import { AppComponent } from 'src/app/app.component'
import { Player } from 'src/app/game/game-model/player'
import { UserConfigService } from '../userconfig.service'

@Injectable({
    providedIn: 'root',
})
export class GamepadService {
    private userConfigService = inject(UserConfigService)
    private ngZone = inject(NgZone)

    private gamepads: GamepadReference[] = []

    constructor() {
        this.gamepads = [{ id: Player.KEYBOARD_ID }]

        this.OnGamepadConnect = this.OnGamepadConnect.bind(this)
        this.OnGamepadDisconnect = this.OnGamepadDisconnect.bind(this)
        window.addEventListener("gamepadconnected", this.OnGamepadConnect)
        window.addEventListener("gamepaddisconnected", this.OnGamepadDisconnect)
    }

    // The dance pads follow their gamepad by id: a reconnected gamepad plays again by itself
    OnGamepadConnect(event: GamepadEvent) {
        const gamepad = event.gamepad
        console.log('Gamepad connected : ' + gamepad.id)
        if (!this.gamepads.some(g => g.id === gamepad.id))
            this.gamepads.push({ id: gamepad.id })

        const playerName = this.GetAssignedPlayerName(gamepad.id)
        if (playerName !== null)
            AppComponent.PresentOkToast(`${playerName}: gamepad ${gamepad.id} connected`)
    }

    OnGamepadDisconnect(event: GamepadEvent) {
        console.log('Gamepad disconnected : ' + event.gamepad.id)
        this.gamepads = this.gamepads.filter(g => g.id !== event.gamepad.id)

        const playerName = this.GetAssignedPlayerName(event.gamepad.id)
        if (playerName !== null)
            AppComponent.PresentWarningToast(`${playerName}: gamepad ${event.gamepad.id} disconnected`)
    }

    GetGamepads(): GamepadReference[] {
        return this.gamepads
    }

    // Name of the first player playing on this gamepad, null if none
    private GetAssignedPlayerName(gamepadId: string): string | null {
        const players = this.userConfigService.players
        const index = players.findIndex(player => player.gamepadId === gamepadId)
        if (index === -1) return null
        return players[index].name ?? `Player ${index + 1}`
    }
}

export type GamepadReference = {
    id: string
}
