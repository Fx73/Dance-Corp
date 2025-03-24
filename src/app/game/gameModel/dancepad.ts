import { ArrowDirection } from "src/app/shared/enumeration/arrow-direction.enum";

type DancePadInput = [ArrowState, ArrowState, ArrowState, ArrowState];
export enum ArrowState {
    Empty = 0, // No input
    Press = 1, // Key has just been pressed
    Hold = 2   // Key is being held down
}

export class DancePad {
    private readonly ArrowDirection = ArrowDirection; // Add clarity for mapping directions
    private gamepadIndex: number;
    private currentState: Set<number>;
    private previousState: Set<number>;

    constructor(gamepadIndex: number = 0) {
        this.gamepadIndex = gamepadIndex;
        this.currentState = new Set();
        this.previousState = new Set();
    }

    // Update gamepad state
    public getState(): DancePadInput {
        const gamepad = navigator.getGamepads()[this.gamepadIndex];

        if (gamepad) {
            this.previousState = new Set(this.currentState); // Save previous state
            this.currentState.clear(); // Reset current state

            gamepad.buttons.forEach((button, index) => {
                if (button.pressed) {
                    this.currentState.add(index);
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
