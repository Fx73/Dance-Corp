import { Injectable, NgZone } from '@angular/core';

import { AppComponent } from '../app.component';
import { UserConfigService } from './userconfig.service';

@Injectable({
    providedIn: 'root',
})
export class GamepadService {


    private gamepads: GamepadReference[] = [];

    constructor(private userConfigService: UserConfigService, private ngZone: NgZone) {
        this.gamepads = [{ index: -1, id: "Keyboard" }]

        this.onGamepadConnect = this.onGamepadConnect.bind(this);
        this.onGamepadDisconnect = this.onGamepadDisconnect.bind(this);
        window.addEventListener("gamepadconnected", this.onGamepadConnect);
        window.addEventListener("gamepaddisconnected", this.onGamepadDisconnect);
    }

    onGamepadConnect(event: GamepadEvent) {
        const gamepad = event.gamepad;
        console.log('Gamepad connected : ' + gamepad.id);
        this.gamepads.push(gamepad)

        const assignedPlayer = this.userConfigService.players.find(player => player.gamepad?.id === gamepad.id);
        if (assignedPlayer) {
            this.userConfigService.updatePlayer('gamepad', assignedPlayer.id, { index: gamepad.index, id: gamepad.id });
            AppComponent.presentOkToast(`Reassigning to player ${assignedPlayer.name} gamepad ${gamepad.id} `)
        }
    }

    onGamepadDisconnect(event: GamepadEvent) {
        console.log('Gamepad disconnected : ' + event.gamepad.id);
        this.gamepads = this.gamepads.filter(g => g.id !== event.gamepad.id);
    }

    getGamepads(): GamepadReference[] {
        return this.gamepads;
    }

}

export type GamepadReference = {
    index: number | null;
    id: string;
};
