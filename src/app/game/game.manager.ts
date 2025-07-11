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
        for (const player of players) {
            this.gameRounds.push(new GameRound(this.music.noteData[0], player, this.isTrainingMode))
        }
    }

    public gameRounds: GameRound[] = [];
    musicPlayer!: IMusicPlayer;
    playerDisplays: PlayerDisplayComponent[] = [];


    private currentBPMIndex = 0;
    private currentBackgroundIndex = 0;
    private zeroTimeStamp: number = 0;

    public registerExternalComponents(musicPlayer: IMusicPlayer/*, playerDisplays: PlayerDisplayComponent[]*/) {
        this.musicPlayer = musicPlayer;
        // this.playerDisplays = playerDisplays;
    }


    public startGame() {
        this.zeroTimeStamp = Math.round(performance.now()) + (this.music!.offset ?? 0) * 1000;
        this.musicPlayer.play()
        this.gameGlobalLoop(this.zeroTimeStamp)
        console.log("Game has started")
    }


    private gameLoopId: number | null = null;
    private gameGlobalLoop(currentTimestamp: DOMHighResTimeStamp): void {
        const roundedTimestamp = Math.round(currentTimestamp)
        const elapsedTime = (roundedTimestamp - this.zeroTimeStamp) / 1000; // In seconds
        const currentBPS = this.music!.bpms[this.currentBPMIndex].value / 60;
        const currentBeat = elapsedTime * currentBPS;
        const tolerance = CONFIG.GAME.TOLERANCE_WINDOW * currentBPS;


        if (this.music!.bpms[this.currentBPMIndex + 1] && elapsedTime >= this.music!.bpms[this.currentBPMIndex + 1].time) {
            this.currentBPMIndex++;
        }

        if (this.music!.bgChanges && this.music!.bgChanges[this.currentBackgroundIndex + 1] && elapsedTime >= this.music!.bgChanges[this.currentBackgroundIndex + 1].time) {
            this.currentBackgroundIndex++;
        }

        for (const gameRound of this.gameRounds)
            gameRound.gameLoop(currentBeat, tolerance)

        /*for (const playerDiplay of this.playerDisplays)
            playerDiplay.Update(currentBeat)*/


        if (this.gameRounds.every(gameRound => gameRound.isFailed || gameRound.isFinished)) {
            this.gameOver()
            return; // Stop loop
        }

        // Schedule the next loop iteration
        this.gameLoopId = requestAnimationFrame(this.gameGlobalLoop.bind(this));
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

    public gameDestroy() {
        if (this.gameLoopId !== null) {
            cancelAnimationFrame(this.gameLoopId);
        }
        this.gameRounds = [];
        this.musicPlayer.stop();
    }
    //#EndRegion
}