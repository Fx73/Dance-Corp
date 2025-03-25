import { ArrowDirection } from "src/app/shared/enumeration/arrow-direction.enum";

export class Player {
    id: number;
    name: string;
    gamepad: { index: number | null, id: string } | undefined;
    keyBindingGamepad: Map<number, ArrowDirection>;
    keyBindingKeyboard: Map<string, ArrowDirection>;


    constructor(id: number) {
        this.id = id;
        this.name = "Guest" + id;
        this.keyBindingGamepad = Player.defaultGamepadBinding();
        this.keyBindingKeyboard = Player.defaultKeyboardbinding();
    }


    toJSON(): object {
        return {
            id: this.id,
            name: this.name,
            gamepad: this.gamepad,
            keyBindingGamepad: Object.fromEntries(this.keyBindingGamepad), // Convert Map to object
            keyBindingKeyboard: Object.fromEntries(this.keyBindingKeyboard), // Convert Map to object
        };
    }

    static fromJSON(json: any): Player {
        const player = new Player(json.id);
        player.name = json.name;
        player.gamepad = json.gamepad;
        player.keyBindingGamepad = new Map<number, ArrowDirection>(Object.entries(json.keyBindingGamepad).map(([k, v]) => [Number(k), v as ArrowDirection]));
        player.keyBindingKeyboard = new Map<string, ArrowDirection>(Object.entries(json.keyBindingKeyboard));
        return player;
    }


    static defaultGamepadBinding(): Map<number, ArrowDirection> {
        return new Map<number, ArrowDirection>([
            [0, ArrowDirection.Left],  // Button 0 -> Left
            [1, ArrowDirection.Down],  // Button 1 -> Down
            [2, ArrowDirection.Up],    // Button 2 -> Up
            [3, ArrowDirection.Right]  // Button 3 -> Right
        ]);
    }

    static defaultKeyboardbinding(): Map<string, ArrowDirection> {
        return new Map<string, ArrowDirection>([
            ['ArrowLeft', ArrowDirection.Left],
            ['ArrowDown', ArrowDirection.Down],
            ['ArrowUp', ArrowDirection.Up],
            ['ArrowRight', ArrowDirection.Right]
        ]);
    }
}