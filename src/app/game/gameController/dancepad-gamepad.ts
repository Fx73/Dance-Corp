import { ArrowState, DancePadInput, IDancePad } from "./dancepad.interface";

import { ArrowDirection } from "src/app/shared/enumeration/arrow-direction.enum";

export class DancePadGamepad implements IDancePad {
    private gamepadIndex: number;
    private currentState: Set<number>;
    private previousState: Set<number>;
    private keyBinding: Map<number, ArrowDirection>;

    constructor(gamepadIndex: number = 0, keyBinding: Map<number, ArrowDirection>) {
        this.gamepadIndex = gamepadIndex;
        this.currentState = new Set();
        this.previousState = new Set();
        this.keyBinding = keyBinding
    }

    // Update gamepad state
    public getState(): DancePadInput {
        const gamepad = navigator.getGamepads()[this.gamepadIndex];

        if (gamepad) {
            this.previousState = new Set(this.currentState);
            this.currentState.clear();

            gamepad.buttons.forEach((button, index) => {
                if (button.pressed && this.keyBinding.has(index)) {
                    this.currentState.add(this.keyBinding.get(index)!);
                }
            });
        }
        const directions: ArrowState[] = [
            this.getArrowInput(ArrowDirection.Left),
            this.getArrowInput(ArrowDirection.Down),
            this.getArrowInput(ArrowDirection.Up),
            this.getArrowInput(ArrowDirection.Right)
        ];

        return directions as DancePadInput;
    }

    private getArrowInput(direction: ArrowDirection): ArrowState {
        if (this.isButtonJustPressed(direction)) {
            return ArrowState.Press;
        } else if (this.isButtonDown(direction)) {
            return ArrowState.Hold;
        } else {
            return ArrowState.Empty;
        }
    }

    // Check if a button is currently pressed
    private isButtonDown(buttonIndex: number): boolean {
        return this.currentState.has(buttonIndex);
    }

    // Check if a button was just pressed
    private isButtonJustPressed(buttonIndex: number): boolean {
        return this.currentState.has(buttonIndex) && !this.previousState.has(buttonIndex);
    }

    // Check if a button was just released
    private isButtonJustReleased(buttonIndex: number): boolean {
        return !this.currentState.has(buttonIndex) && this.previousState.has(buttonIndex);
    }
}
