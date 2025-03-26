export enum ArrowState {
    Empty = 0, // No input
    Press = 1, // Key has just been pressed
    Hold = 2   // Key is being held down
}

export type DancePadInput = [ArrowState, ArrowState, ArrowState, ArrowState];

export interface IDancePad {
    getRefreshedState(): DancePadInput
    lastExposedState: DancePadInput
}
