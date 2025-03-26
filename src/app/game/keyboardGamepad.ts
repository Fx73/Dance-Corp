//@decprecated
export class KeyboardGamepad {
    buttons: { pressed: boolean }[] = [];

    constructor(private keyMapping: { [key: string]: number }) {
        for (let i = 0; i < Object.values(keyMapping).length; i++) {
            this.buttons.push({ pressed: false });
        }
        this.startListening()
    }
    public destroy(): void {
        this.stopListening();
    }

    startListening(): void {
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    stopListening(): void {
        document.removeEventListener('keydown', this.onKeyDown.bind(this));
        document.removeEventListener('keyup', this.onKeyUp.bind(this));
    }

    private onKeyDown(event: KeyboardEvent): void {
        const buttonIndex = this.keyMapping[event.key];
        if (buttonIndex !== undefined)
            this.buttons[buttonIndex].pressed = true;

    }

    private onKeyUp(event: KeyboardEvent): void {
        const buttonIndex = this.keyMapping[event.key];
        if (buttonIndex !== undefined)
            this.buttons[buttonIndex].pressed = false;

    }

}
