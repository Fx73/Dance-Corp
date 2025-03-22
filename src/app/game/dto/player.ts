import { ArrowDirection } from "src/app/shared/enumeration/arrow-direction.enum";

export class Player {
    id: number;
    name: string;
    gamepad: { index: number | null, id: string } | undefined;
    keyBindings: { [action: string]: string | null };


    constructor(id: number) {
        this.id = id;
        this.name = "Guest" + id;
        this.keyBindings = {
            [ArrowDirection.Up]: null,
            [ArrowDirection.Down]: null,
            [ArrowDirection.Left]: null,
            [ArrowDirection.Right]: null,
        };
    }
}