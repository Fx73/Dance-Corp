export class UserDto {
    id: string;
    name: string;
    avatar?: string;
    level: number = 0;
    musicPlayed: number = 0;
    musicCleared: number = 0;
    preferedGamepad: string = " - ";
    preferedMusic: string = " - ";


    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
    }


}

export class UserMusicDto {
    id: string;
    timesPlayed: number = 0;

    constructor(id: string) {
        this.id = id;
    }
}

export class UserNoteDto {
    id: string;
    timesPlayed: number = 0;
    maxScore: number = 0;
    usedGamepad: string = "";

    constructor(id: string) {
        this.id = id;
    }
}
