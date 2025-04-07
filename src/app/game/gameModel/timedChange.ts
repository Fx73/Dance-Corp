export interface ITimedChange {
    time: number;
    value: string | number;
}

export class BpmChange implements ITimedChange {
    time: number = 0;
    value: number = 120;
}

export class TextChange implements ITimedChange {
    time: number = 0;
    value: string = "";

    constructor(time: number, value: string) {
        this.time = time;
        this.value = value;
    }
}
