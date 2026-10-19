import { ArrowDirection } from "src/app/game/constants/arrow-direction.enum";

/** Forme sérialisée d'un Player (localStorage) */
export interface PlayerJSON {
    name: string | undefined;
    userId: string | null;
    gamepad: { index: number | null, id: string } | undefined;
    keyBindingGamepad: Record<string, ArrowDirection>;
    keyBindingKeyboard: Record<string, ArrowDirection>;
}

export class Player {
    name: string | undefined;
    userId: string | null = null
    gamepad: { index: number | null, id: string } | undefined;
    keyBindingGamepad: Map<number, ArrowDirection>;
    keyBindingKeyboard: Map<string, ArrowDirection>;


    constructor() {
        this.keyBindingGamepad = Player.defaultGamepadBinding();
        this.keyBindingKeyboard = Player.defaultKeyboardbinding();
    }


    toJSON(): PlayerJSON {
        return {
            name: this.name,
            userId: this.userId,
            gamepad: this.gamepad,
            keyBindingGamepad: Object.fromEntries(this.keyBindingGamepad), // Convert Map to object
            keyBindingKeyboard: Object.fromEntries(this.keyBindingKeyboard), // Convert Map to object
        };
    }

    static fromJSON(json: PlayerJSON): Player {
        const player = new Player();
        player.userId = json.userId;
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