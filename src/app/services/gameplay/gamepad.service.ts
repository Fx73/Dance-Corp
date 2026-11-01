import { Injectable, NgZone, inject } from '@angular/core'

import { NativeGamepad, NativeGamepadService } from '../thirdpartyapp/native-gamepad.service'

import { AppComponent } from 'src/app/app.component'
import { DancePadGamepad } from 'src/app/game/game-controller/dancepad-gamepad'
import { Player } from 'src/app/game/game-model/player'
import { UserConfigService } from '../userconfig.service'

export enum GamepadStatus {
    Active, // The keyboard, or a gamepad the webview sees: it plays
    Plugged, // Plugged in (desktop), not seen by the webview yet: it plays from its first button press
    Unplugged, // Not plugged in (desktop)
    Unknown, // Not seen by the webview yet, and the system cannot tell (browser, XInput gamepad)
}

@Injectable({
    providedIn: 'root',
})
export class GamepadService {
    private userConfigService = inject(UserConfigService)
    private nativeGamepadService = inject(NativeGamepadService)
    private ngZone = inject(NgZone)

    private gamepads: GamepadReference[] = []

    constructor() {
        this.gamepads = [{ id: Player.KEYBOARD_ID }]

        this.OnGamepadConnect = this.OnGamepadConnect.bind(this)
        this.OnGamepadDisconnect = this.OnGamepadDisconnect.bind(this)
        window.addEventListener("gamepadconnected", this.OnGamepadConnect)
        window.addEventListener("gamepaddisconnected", this.OnGamepadDisconnect)
        this.nativeGamepadService.connected.subscribe(gamepad => this.OnNativeGamepadConnect(gamepad))
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

    // Desktop: a gamepad plugged in before the webview sees it waits for a button press
    private OnNativeGamepadConnect(gamepad: NativeGamepad) {
        this.userConfigService.players.forEach((player, index) => {
            if (player.gamepadId === undefined || NativeGamepadService.IsGamepadOf(gamepad, player.gamepadId) !== true) return
            if (DancePadGamepad.FindGamepad(player.gamepadId) !== null) return
            AppComponent.PresentOkToast(`${player.name ?? `Player ${index + 1}`}: gamepad plugged in, press one of its buttons to activate it`)
        })
    }

    GetGamepads(): GamepadReference[] {
        return this.gamepads
    }

    GetStatus(gamepadId: string): GamepadStatus {
        if (gamepadId === Player.KEYBOARD_ID || DancePadGamepad.FindGamepad(gamepadId) !== null)
            return GamepadStatus.Active

        const isPlugged = this.nativeGamepadService.IsPlugged(gamepadId)
        if (isPlugged === null) return GamepadStatus.Unknown
        return isPlugged ? GamepadStatus.Plugged : GamepadStatus.Unplugged
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
