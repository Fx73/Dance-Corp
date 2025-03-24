import { ArrowDirection } from "src/app/shared/enumeration/arrow-direction.enum";

export class Player {
    id: number;
    name: string;
    gamepad: { index: number | null, id: string } | undefined;
    keyBindings: Array<[ArrowDirection, number]>;
    keyboardBindings: { [btnLinked: string]: number };


    constructor(id: number) {
        this.id = id;
        this.name = "Guest" + id;
        this.keyBindings = Player.defaultKeybinding();
        this.keyboardBindings = {
            ['ArrowLeft']: 0,
            ['ArrowDown']: 1,
            ['ArrowUp']: 2,
            ['ArrowRight']: 3,
        };
    }

    static defaultKeybinding(): Array<[ArrowDirection, number]> {
        return [
            [ArrowDirection.Left, 0],
            [ArrowDirection.Down, 1],
            [ArrowDirection.Up, 2],
            [ArrowDirection.Right, 3],
        ];
    }

}