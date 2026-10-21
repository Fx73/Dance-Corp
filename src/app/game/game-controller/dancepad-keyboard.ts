import { ArrowState, DancePadInput, IDancePad } from "./dancepad.interface"

import { ArrowDirection } from "src/app/game/constants/arrow-direction.enum"

export class DancePadKeyboard implements IDancePad {
    private currentState: Set<number>
    private previousState: Set<number>
    private keyBinding: Map<string, ArrowDirection>

    public lastExposedState: DancePadInput

    constructor(keyBinding: Map<string, ArrowDirection>) {
        this.currentState = new Set()
        this.previousState = new Set()
        this.keyBinding = keyBinding
        this.lastExposedState = [0, 0, 0, 0, 0]

        // Listen for keyboard events
        window.addEventListener('keydown', (event) => this.HandleKeyDown(event))
        window.addEventListener('keyup', (event) => this.HandleKeyUp(event))
    }

    private HandleKeyDown(event: KeyboardEvent): void {
        if (!event.repeat && this.keyBinding.has(event.key)) {
            this.currentState.add(this.keyBinding.get(event.key)!)
        }
    }

    private HandleKeyUp(event: KeyboardEvent): void {
        if (this.keyBinding.has(event.key)) {
            this.currentState.delete(this.keyBinding.get(event.key)!)
        }
    }

    // Update keyboard state and return DancePadInput
    public GetRefreshedState(): DancePadInput {
        this.lastExposedState = [
            this.GetArrowInput(ArrowDirection.Left),
            this.GetArrowInput(ArrowDirection.Down),
            this.GetArrowInput(ArrowDirection.Up),
            this.GetArrowInput(ArrowDirection.Right),
            this.GetArrowInput(ArrowDirection.Start)
        ] as DancePadInput

        this.previousState = new Set(this.currentState)

        return this.lastExposedState
    }

    private GetArrowInput(direction: ArrowDirection): ArrowState {
        if (this.IsButtonJustPressed(direction)) {
            return ArrowState.Press
        } else if (this.IsButtonDown(direction)) {
            return ArrowState.Hold
        } else {
            return ArrowState.Empty
        }
    }

    // Check if a button is currently pressed
    private IsButtonDown(buttonIndex: number): boolean {
        return this.currentState.has(buttonIndex)
    }

    // Check if a button was just pressed
    private IsButtonJustPressed(buttonIndex: number): boolean {
        return this.currentState.has(buttonIndex) && !this.previousState.has(buttonIndex)
    }

    // Check if a button was just released
    private IsButtonJustReleased(buttonIndex: number): boolean {
        return !this.currentState.has(buttonIndex) && this.previousState.has(buttonIndex)
    }
}
