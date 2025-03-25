import { ArrowState, DancePadInput, IDancePad } from "./dancepad.interface";

import { ArrowDirection } from "src/app/shared/enumeration/arrow-direction.enum";

export class DancePadKeyboard implements IDancePad {
    private currentState: Set<number>;
    private previousState: Set<number>;

    private keyBinding: Map<string, ArrowDirection>;

    constructor(keyBinding: Map<string, ArrowDirection>) {
        this.currentState = new Set();
        this.previousState = new Set();
        this.keyBinding = keyBinding

        // Listen for keyboard events
        window.addEventListener('keydown', (event) => this.handleKeyDown(event));
        window.addEventListener('keyup', (event) => this.handleKeyUp(event));
    }

    private handleKeyDown(event: KeyboardEvent): void {
        if (!event.repeat && this.keyBinding.has(event.key)) {
            this.currentState.add(this.keyBinding.get(event.key)!);
        }
    }

    private handleKeyUp(event: KeyboardEvent): void {
        if (this.keyBinding.has(event.key)) {
            this.currentState.delete(this.keyBinding.get(event.key)!);
        }
    }

    // Update keyboard state and return DancePadInput
    public getState(): DancePadInput {
        const directions: ArrowState[] = [
            this.getArrowInput(ArrowDirection.Left),
            this.getArrowInput(ArrowDirection.Down),
            this.getArrowInput(ArrowDirection.Up),
            this.getArrowInput(ArrowDirection.Right)
        ];

        this.previousState = new Set(this.currentState);

        console.log(directions)
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
