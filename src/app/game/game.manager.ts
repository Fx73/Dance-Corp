import { AnnouncerService } from '../services/gameplay/announcer.service';
import { BeatManager } from './game-model/timeline/beatManager';
import { CONFIG } from "./constants/game-config";
import { GameRound } from './game-model/gameRound';
import { IMusicPlayer } from "./music-player/IMusicPlayer";
import { MusicDto } from './game-model/music.dto';
import { Player } from './game-model/player';
import { PlayerDisplayComponent } from "./game-display/player-display.component";
import { UserCacheService } from 'src/app/services/local-storage/user.cache.service';
import { UserNoteDto } from '../pages/user-profile/user.dto';

export class GameManager {

    music: MusicDto
    isTrainingMode: boolean = false;
    mainUserStats: UserNoteDto | null = null;

    constructor(music: MusicDto, players: Player[], noteSelected: number[], isTrainingMode: boolean, private userCacheService: UserCacheService, private announcerService: AnnouncerService) {
        this.music = music
        this.isTrainingMode = isTrainingMode

        for (let index = 0; index < players.length; index++) {
            const player = players[index];
            this.gameRounds.push(new GameRound(this.music.noteData[noteSelected[index]], player, this.isTrainingMode, announcerService))
        }

        this.beatManager = new BeatManager(this.music);
        this.mainUserStats = this.userCacheService.getMusicStats(this.music.id).notes.find((n: UserNoteDto) => n.id === this.music.noteData[noteSelected[0]].chartName) ?? null;
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

        if (this.music!.bgChanges && this.music!.bgChanges[this.currentBackgroundIndex + 1] && currentBeat >= this.music!.bgChanges[this.currentBackgroundIndex + 1].time) {
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
        console.log(this.music, this.music!.id)
        this.isGameOver = true;

        // At least one player finished and has a score of MAX_SCORE
        if (this.gameRounds.some(gr => gr.isFinished && gr.score >= gr.MAX_SCORE)) {
            this.announcerService.playAnnouncer("victory");
            this.announcerService.playCrowdOneShot("special");
        }
        // At least one player finished and has a score of A
        else if (this.gameRounds.some(gr => gr.isFinished && gr.score >= gr.MAX_SCORE * 0.9)) {
            this.announcerService.playAnnouncer("victory");
            this.announcerService.playCrowdOneShot("applause_heavy");
        }
        // At least one player finished
        else if (this.gameRounds.some(gr => gr.isFinished)) {
            this.announcerService.playAnnouncer("victory_small");
            this.announcerService.playCrowdOneShot("applause_light");
        }
        // All players failed
        else {
            this.announcerService.playAnnouncer("game_over");
            this.announcerService.playCrowdOneShot("boo");
        }
        // Main Player get new highscore
        if (this.gameRounds[0].isFinished && this.mainUserStats && this.gameRounds[0].score > this.mainUserStats.highScore) {
            this.announcerService.playAnnouncer("high_score");
        }

        if (!this.isTrainingMode) {
            for (const gameRound of this.gameRounds)
                this.userCacheService.updateUserStatsFromRound(this.music!.id, this.music?.noteData[0].chartName!, gameRound)
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
