import { ArrowState, DancePadInput, IDancePad } from "./dancepad.interface"

import { ArrowDirection } from "src/app/game/constants/arrow-direction.enum"

export class DancePadGamepad implements IDancePad {
    private gamepadIndex: number
    private currentState: Set<number>
    private previousState: Set<number>
    private keyBinding: Map<number, ArrowDirection>

    public lastExposedState: DancePadInput

    // TODO: Add input mapping for enter button
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(gamepadIndex: number = 0, keyBinding: Map<number, ArrowDirection>, enterBinding: number = -1) {
        this.gamepadIndex = gamepadIndex
        this.currentState = new Set()
        this.previousState = new Set()
        this.keyBinding = keyBinding
        this.lastExposedState = [0, 0, 0, 0, 0]
    }

    // Update gamepad state
    public GetRefreshedState(): DancePadInput {
        const gamepad = navigator.getGamepads()[this.gamepadIndex]

        if (gamepad) {
            this.previousState = new Set(this.currentState)
            this.currentState.clear()

            gamepad.buttons.forEach((button, index) => {
                if (button.pressed && this.keyBinding.has(index)) {
                    this.currentState.add(this.keyBinding.get(index)!)
                }
            })
        }

        this.lastExposedState = [
            this.GetArrowInput(ArrowDirection.Left),
            this.GetArrowInput(ArrowDirection.Down),
            this.GetArrowInput(ArrowDirection.Up),
            this.GetArrowInput(ArrowDirection.Right),
            this.GetArrowInput(ArrowDirection.Start)
        ] as DancePadInput

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

    public Destroy(): void {
        // Nothing to release: the gamepad is polled
    }

}
