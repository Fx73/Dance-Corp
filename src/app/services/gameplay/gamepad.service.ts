import { Injectable, NgZone, inject } from '@angular/core'

import { AppComponent } from 'src/app/app.component'
import { UserConfigService } from '../userconfig.service'

@Injectable({
    providedIn: 'root',
})
export class GamepadService {
    private userConfigService = inject(UserConfigService)
    private ngZone = inject(NgZone)

    private gamepads: IGamepadReference[] = []

    constructor() {
        this.gamepads = [{ index: -1, id: "Keyboard" }]

        this.OnGamepadConnect = this.OnGamepadConnect.bind(this)
        this.OnGamepadDisconnect = this.OnGamepadDisconnect.bind(this)
        window.addEventListener("gamepadconnected", this.OnGamepadConnect)
        window.addEventListener("gamepaddisconnected", this.OnGamepadDisconnect)
    }

    OnGamepadConnect(event: GamepadEvent) {
        const gamepad = event.gamepad
        console.log('Gamepad connected : ' + gamepad.id)
        this.gamepads.push(gamepad)

        const assignedIndex = this.userConfigService.players.findIndex(player => player.gamepad?.id === gamepad.id)
        const assignedPlayer = this.userConfigService.players.at(assignedIndex)
        if (assignedIndex !== -1 && assignedPlayer) {
            this.userConfigService.UpdatePlayer('gamepad', assignedIndex, { index: gamepad.index, id: gamepad.id })
            AppComponent.PresentOkToast(`Reassigning to player ${assignedPlayer.name} gamepad ${gamepad.id} `)
        }
    }

    OnGamepadDisconnect(event: GamepadEvent) {
        console.log('Gamepad disconnected : ' + event.gamepad.id)
        this.gamepads = this.gamepads.filter(g => g.id !== event.gamepad.id)
    }

    GetGamepads(): IGamepadReference[] {
        return this.gamepads
    }

}

export interface IGamepadReference {
    index: number | null
    id: string
}
