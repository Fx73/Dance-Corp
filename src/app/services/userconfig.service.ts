import { BehaviorSubject } from 'rxjs';
import { GamepadReference } from './gamepad.service';
import { Injectable } from '@angular/core';
import { Player } from '../game/dto/player';

@Injectable({
    providedIn: 'root',
})
export class UserConfigService {
    //#region Constants
    private readonly CONFIG_STORAGE_KEY = "userConfig"
    private readonly PLAYERS_STORAGE_KEY = (index: number) => `playersConfig${index}`;
    //#endregion

    private configSubject: BehaviorSubject<UserConfig> = new BehaviorSubject<UserConfig>(new UserConfig());
    config$ = this.configSubject.asObservable();

    players: Player[] = []

    constructor() {
        const storedConfig: UserConfig = JSON.parse(localStorage.getItem(this.CONFIG_STORAGE_KEY) || '{}');
        const defaultConfig = new UserConfig();

        this.configSubject = new BehaviorSubject<UserConfig>({ ...defaultConfig, ...storedConfig });

        for (let i = 0; i < this.configSubject.value.playerNumber; i++) {
            this.players.push(this.instanciatePlayer(i));
        }

    }
    instanciatePlayer(index: number): Player {
        const storedPlayer = localStorage.getItem(this.PLAYERS_STORAGE_KEY(index));
        const player: Player = storedPlayer ? JSON.parse(storedPlayer) : new Player(index)

        // Reassociating the gamepad if it exists and is valid
        if (player.gamepad && player.gamepad.index != -1) {
            const matchingGamepad = navigator.getGamepads().find(g => g?.id === player.gamepad!.id);
            player.gamepad.index = matchingGamepad ? matchingGamepad.index : null;
        }
        return player
    }


    getConfig(): { [key: string]: any } {
        return this.configSubject.value;
    }

    updatePlayerCount(count: number) {
        const currentCount = this.configSubject.value.playerNumber;
        if (count > currentCount) {
            for (let i = currentCount + 1; i <= count; i++)
                this.players.push(this.instanciatePlayer(i));

        } else if (count < currentCount) {
            this.players.splice(count);
        }

        this.updateConfig("playerNumber", count)
    }


    updateConfig(option: keyof UserConfig, value: any): void {
        if (!(option in this.configSubject.value)) {
            console.error(`Invalid option  : ${option}`);
            return;
        }

        const updatedConfig = { ...this.configSubject.value, [option]: value };
        this.configSubject.next(updatedConfig);

        localStorage.setItem(this.CONFIG_STORAGE_KEY, JSON.stringify(this.configSubject.value));
    }

    assignKeyboardToPlayer(playerIndex: number): void {
        const player = this.players[playerIndex];
        if (!player) {
            console.error(`Invalid player index: ${playerIndex}`);
            return;
        }
        player.keyBindings = Player.defaultKeybinding();

        this.updatePlayer('gamepad', playerIndex, { index: -1, id: "Keyboard" });
    }


    updatePlayer(option: keyof Player, playerIndex: number, value: any): void {
        if (playerIndex < 0 || playerIndex >= this.players.length) {
            console.error(`Invalid player index: ${playerIndex}`);
            return;
        }

        const player: Player = this.players[playerIndex];
        (player[option as keyof Player] as any) = value;
        localStorage.setItem(this.PLAYERS_STORAGE_KEY(playerIndex), JSON.stringify(player));
    }


    resetToDefault(): void {
        localStorage.removeItem(this.CONFIG_STORAGE_KEY);
        for (let index = 0; index < 4; index++)
            localStorage.removeItem(this.PLAYERS_STORAGE_KEY(index));
    }

}

class UserConfig {
    playerNumber = 1;
    showBars = true


}