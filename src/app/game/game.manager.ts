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

        let cumulatedTimeStart = 0;
        for (let i = 0; i < this.music.bpms.length; i++) {
            const bps = this.music.bpms[i].value / 60; // Convert BPM to BPS
            const beatStart = this.music.bpms[i].time;
            const timeStart = cumulatedTimeStart;
            this.bpmSections.push(new BPMSection(timeStart, beatStart, bps));
            if (this.music.bpms[i + 1]) {
                cumulatedTimeStart += (this.music.bpms[i + 1].time - this.music.bpms[i].time) / bps;
            }
        }
    }

    public gameRounds: GameRound[] = [];
    musicPlayer!: IMusicPlayer;
    playerDisplays: PlayerDisplayComponent[] = [];


    private currentBPMIndex = 0;
    private bpmSections: BPMSection[] = [];
    private currentBackgroundIndex = 0;
    private zeroTimeStamp: number = 0;

    public registerExternalComponents(musicPlayer: IMusicPlayer/*, playerDisplays: PlayerDisplayComponent[]*/) {
        this.musicPlayer = musicPlayer;
        // this.playerDisplays = playerDisplays;
    }

    public async startGame() {
        console.log("Waiting for audio to start…");

        this.musicPlayer.play();
        await new Promise<void>(resolve => { const check = () => { const t = this.musicPlayer.getCurrentTime(); if (t > 0) { resolve(); } else { requestAnimationFrame(check); } }; check(); });

        const musicCurrentTime = this.musicPlayer.getCurrentTime();
        this.zeroTimeStamp = Math.round(performance.now()) - (musicCurrentTime * 1000) - (this.music!.offset * 1000);


        this.gameGlobalLoop(this.zeroTimeStamp);

        console.log("Game has started");
    }




    private gameLoopId: number | null = null;
    private gameGlobalLoop(currentTimestamp: DOMHighResTimeStamp): void {
        const roundedTimestamp = Math.round(currentTimestamp)
        const elapsedTime = (roundedTimestamp - this.zeroTimeStamp) / 1000; // In seconds

        const section = this.bpmSections[this.currentBPMIndex];
        const timeInSection = elapsedTime - section.timeStart;
        const beatInSection = timeInSection * section.bps;
        const currentBeat = section.beatStart + beatInSection;



        if (this.bpmSections[this.currentBPMIndex + 1] && elapsedTime >= this.bpmSections[this.currentBPMIndex + 1].timeStart) {
            this.currentBPMIndex++;
        }

        if (this.music!.bgChanges && this.music!.bgChanges[this.currentBackgroundIndex + 1] && elapsedTime >= this.music!.bgChanges[this.currentBackgroundIndex + 1].time) {
            this.currentBackgroundIndex++;
        }

        for (const gameRound of this.gameRounds)
            gameRound.gameLoop(currentBeat, CONFIG.GAME.TOLERANCE_WINDOW * this.bpmSections[this.currentBPMIndex].bps)

        /*for (const playerDiplay of this.playerDisplays)
            playerDiplay.Update(currentBeat)*/


        if (this.gameRounds.every(gameRound => gameRound.isFailed || gameRound.isFinished)) {
            this.gameOver()
            return; // Stop loop
        }

        // sync with musicPlayer
        const musicCurrentTime = this.musicPlayer.getCurrentTime();

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
