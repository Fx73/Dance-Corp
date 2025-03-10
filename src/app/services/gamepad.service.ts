import { Injectable, NgZone } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class GamepadService {
    gamepad: Gamepad | null = null;

    constructor(private ngZone: NgZone) {
        this.addGamePadEventListener();
    }

    private addGamePadEventListener(): void {
        console.log('Gamepad service started.');
        window.addEventListener('gamepadconnected', (event: GamepadEvent) => {
            console.log('Gamepad connected event.');
            this.ngZone.run(() => {
                this.gamepad = event.gamepad;
                console.log(this.gamepad);
                console.log(`Gamepad connected: ${event.gamepad.id}`);
            });
        });

        window.addEventListener('gamepaddisconnected', () => {
            this.ngZone.run(() => {
                this.gamepad = null;
                console.log('Gamepad disconnected.');
            });
        });
    }

    // Met à jour le gamepad activement
    updateGamepadState(): void {
        if (this.gamepad) {
            this.ngZone.run(() => {
                this.gamepad = navigator.getGamepads()[this.gamepad!.index] || null;
            });
        }
    }

    // Vérifie si un bouton est pressé
    isButtonPressed(index: number): boolean {
        return this.gamepad?.buttons[index]?.pressed || false;
    }

    // Retourne le nombre total de boutons
    getTotalButtons(): number {
        return this.gamepad ? this.gamepad.buttons.length : 0;
    }

    // Retourne les axes du gamepad
    getAxes(): readonly number[] {
        return this.gamepad ? this.gamepad.axes : [];
    }
}
