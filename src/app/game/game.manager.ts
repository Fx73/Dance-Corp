import { BeatManager } from './gameModel/timeManagement/beatManager';
import { CONFIG } from "./constants/game-config";
import { GameRound } from "./gameModel/gameRound";
import { IMusicPlayer } from "./musicPlayer/IMusicPlayer";
import { MusicDto } from "./gameModel/music.dto";
import { Player } from "./gameModel/player";
import { PlayerDisplayComponent } from "./gameDisplay/player-display.component";
import { UserFirestoreService } from 'src/app/services/firestore/user.firestore.service';

export class GameManager {

    music: MusicDto
    isTrainingMode: boolean = false;

    constructor(music: MusicDto, players: Player[], isTrainingMode: boolean, private userFirestoreService: UserFirestoreService) {
        this.music = music
        this.isTrainingMode = isTrainingMode

        for (let index = 0; index < players.length; index++) {
            const player = players[index];
            this.gameRounds.push(new GameRound(this.music.noteData[index], player, this.isTrainingMode))
        }

        this.beatManager = new BeatManager(this.music);
    }

    public gameRounds: GameRound[] = [];
    musicPlayer!: IMusicPlayer;
    playerDisplays: PlayerDisplayComponent[] = [];

    private beatManager: BeatManager;

    private currentBackgroundIndex = 0;
    private zeroTimeStamp: number = 0;

    public registerExternalComponents(musicPlayer: IMusicPlayer) {
        this.musicPlayer = musicPlayer;
    }

    public async startGame() {
        console.log("Waiting for audio to start…");

        this.musicPlayer.play();
        await new Promise<void>(resolve => { const check = () => { const t = this.musicPlayer.getCurrentTime(); if (t > 0) { resolve(); } else { requestAnimationFrame(check); } }; check(); });

        const musicCurrentTime = this.musicPlayer.getCurrentTime();
        this.zeroTimeStamp = Math.round(performance.now()) - (musicCurrentTime * 1000);


        this.gameGlobalLoop(this.zeroTimeStamp);

        console.log("Game has started");
    }




    private gameLoopId: number | null = null;
    private gameGlobalLoop(currentTimestamp: DOMHighResTimeStamp): void {
        const roundedTimestamp = Math.round(currentTimestamp)
        const elapsedTime = (roundedTimestamp - this.zeroTimeStamp) / 1000; // In seconds

        const { beat: currentBeat, bps: currentBps } = this.beatManager.getBeatAndBpsAtTime(elapsedTime);

        if (this.music!.bgChanges && this.music!.bgChanges[this.currentBackgroundIndex + 1] && elapsedTime >= this.music!.bgChanges[this.currentBackgroundIndex + 1].time) {
            this.currentBackgroundIndex++;
        }

        for (const gameRound of this.gameRounds)
            gameRound.gameLoop(currentBeat, CONFIG.GAME.TOLERANCE_WINDOW * currentBps)


        if (this.gameRounds.every(gameRound => gameRound.isFailed || gameRound.isFinished)) {
            this.gameOver()
            return; // Stop loop
        }

        // sync with musicPlayer
        //const musicCurrentTime = this.musicPlayer.getCurrentTime();

        // Schedule the next loop iteration
        this.gameLoopId = requestAnimationFrame(this.gameGlobalLoop.bind(this));
    }


    public getCurrentBackground(): string {
        if (!this.music.bgChanges || this.music.bgChanges.length === 0) {
            return CONFIG.GAME.DEFAULT_BACKGROUND;
        }
        return "https://" + this.music.bgChanges[this.currentBackgroundIndex].value;
    }

    //#Region Game Over
    private _isGameOver: boolean = false;
    public get isGameOver(): boolean {
        return this._isGameOver;
    }

    private set isGameOver(value: boolean) {
        this._isGameOver = value;
    }
    gameOver() {
        console.log('Game Over: All game rounds have failed or finished.');

        this.isGameOver = true;
        if (!this.isTrainingMode) {
            for (const gameRound of this.gameRounds)
                this.userFirestoreService.updateUserStatsFromRound(this.music!.id, this.music?.noteData[0].chartName!, gameRound)
        }

    }

    public destroyGame() {
        if (this.gameLoopId !== null) {
            cancelAnimationFrame(this.gameLoopId);
        }
        this.gameRounds = [];
    }
    //#EndRegion
}

class BPMSection {
    timeStart: number;
    beatStart: number;
    bps: number;

    constructor(timeStart: number, beatStart: number, bps: number) {
        this.timeStart = timeStart;
        this.beatStart = beatStart;
        this.bps = bps;
    }
}
