import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, QueryList, Type, ViewChild, ViewChildren, input } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { IMusicPlayer, MusicOrigin } from './musicPlayer/IMusicPlayer';
import { IonButton, IonCard, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { MusicDto, NoteDataDto } from './gameModel/music.dto';

import { AppComponent } from '../app.component';
import { ArrowDirection } from "./constants/arrow-direction.enum";
import { FormsModule } from '@angular/forms';
import { GameOverComponent } from "./gameDisplay/game-over/game-over.component";
import { GameRound } from './gameModel/gameRound';
import { MusicCacheService } from './../services/dataCache/music.cache.service';
import { MusicPlayerSoundcloudComponent } from './musicPlayer/music-player-soundcloud/music-player-soundcloud.component';
import { MusicPlayerYoutubeComponent } from "./musicPlayer/music-player-youtube/music-player-youtube.component";
import { Player } from './gameModel/player';
import { PlayerDisplayComponent } from "./gameDisplay/player-display.component";
import { Router } from "@angular/router";
import { UserConfigService } from "src/app/services/userconfig.service";
import { UserFirestoreService } from 'src/app/services/firestore/user.firestore.service';
import { WaitingScreenComponent } from "./gameDisplay/waiting-screen/waiting-screen.component";

@Component({
  selector: 'app-game',
  templateUrl: './game.page.html',
  styleUrls: ['./game.page.scss'],
  standalone: true,
  imports: [IonCard, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, PlayerDisplayComponent, GameOverComponent, WaitingScreenComponent]
})
export class GamePage implements OnInit, OnDestroy, AfterViewInit {
  //#region App Constants
  readonly ArrowDirection = ArrowDirection;
  readonly MusicOrigin = MusicOrigin;
  //#endregion
  //#region Music
  music: MusicDto | null = null;
  musicPlayer!: IMusicPlayer;
  musicOrigin: MusicOrigin = MusicOrigin.Youtube
  backgroundUrl: string = "assets/Splash/Texture.png";
  private nextBgTime: number | null = null;
  loadingMusic: boolean = true;
  //#endregion


  @ViewChild(WaitingScreenComponent) waitingScreen!: WaitingScreenComponent;

  @ViewChildren(PlayerDisplayComponent) playerDisplaysQuery!: QueryList<PlayerDisplayComponent>;
  private playerDisplays: PlayerDisplayComponent[] = [];

  musicPlayerComponent: Type<IMusicPlayer> | undefined;


  players: Player[] = [];
  gameRounds: GameRound[] = []

  public isGameOver: Boolean = false
  private gameLoopId: number | null = null;
  zeroTimeStamp: number = 0;

  constructor(private userConfigService: UserConfigService, private userFirestoreService: UserFirestoreService, private musicCacheService: MusicCacheService, private router: Router, private location: Location) { }


  ngOnInit() {
    // Get Data
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.music = navigation.extras.state['music'];
    }
    if (this.music === null || this.music.music === undefined || this.music.noteData.length === 0) {
      this.router.navigate(['/home']);
      return;
    }

    // Prepare Music Player
    const musicOrigin = this.pickMusicPlayer(this.music!.music!)
    if (musicOrigin == null) {
      AppComponent.presentWarningToast("Error loading music in player !")
      return;
    }
    this.musicOrigin = musicOrigin
    this.musicPlayerComponent = this.resolveMusicPlayer(this.musicOrigin);

    // Cache init if allowed
    if (this.musicOriginAllowCache(this.musicOrigin) && this.userConfigService.getConfig()["allowCache"]) {
      this.musicCacheService.addMusicToCache(this.music!)
    }


    // Prepare Background
    if (this.music!.bgChanges) this.nextBgTime = this.music!.bgChanges[0].time

    // Prepare Players
    const isTrainingMode: boolean = this.userConfigService.getConfig()["trainingMode"] ?? false
    this.players = this.userConfigService.players;

    for (const player of this.players) {
      this.gameRounds.push(new GameRound(this.music, this.music.noteData[0], player, isTrainingMode))
    }
  }

  ngAfterViewInit() {
    this.playerDisplays = this.playerDisplaysQuery.toArray();
    if (this.musicPlayer)
      this.waitingScreen.startCountdown();
  }

  onPlayerReady(player: IMusicPlayer) {
    this.musicPlayer = player
    if (this.playerDisplays.length > 0)
      this.waitingScreen.startCountdown();

  }

  handleCountdownFinished() {
    this.loadingMusic = false;
    this.startGame();
  }


  ngOnDestroy(): void {
    if (this.gameLoopId !== null) {
      cancelAnimationFrame(this.gameLoopId);
    }
    this.gameRounds = [];
  }

  startGame() {
    this.musicPlayer.play()
    this.zeroTimeStamp = Math.round(performance.now()) + (this.music!.offset ?? 0) * 1000;
    this.gameGlobalLoop(this.zeroTimeStamp)
    console.log("Game has started")
  }


  private gameGlobalLoop(currentTimestamp: DOMHighResTimeStamp): void {
    const roundedTimestamp = Math.round(currentTimestamp)
    const elapsedTime = (roundedTimestamp - this.zeroTimeStamp) / 1000; // In seconds

    for (const gameRound of this.gameRounds)
      gameRound.gameLoop(elapsedTime)

    for (const playerDiplay of this.playerDisplays)
      playerDiplay.Update()

    if (this.nextBgTime && elapsedTime >= this.nextBgTime) {
      const bgChange = this.music!.bgChanges?.find(change => change.time === this.nextBgTime);
      this.backgroundUrl = bgChange?.value || 'assets/Splash/Texture.png';
      this.nextBgTime = bgChange?.time ?? null;
    }

    if (this.gameRounds.every(gameRound => gameRound.isFailed || gameRound.isFinished)) {
      this.gameOver()
      return; // Stop loop
    }

    // Schedule the next loop iteration
    this.gameLoopId = requestAnimationFrame(this.gameGlobalLoop.bind(this));
  }


  gameOver() {
    console.log('Game Over: All game rounds have failed or finished.');

    this.isGameOver = true;
    for (const gameRound of this.gameRounds)
      this.userFirestoreService.updateUserStatsFromRound(this.music!.id, this.music?.noteData[0].chartName!, gameRound)
  }

  //#region Music Player
  private pickMusicPlayer(uri: string): MusicOrigin | null {
    if (!uri) return null;

    if (uri.includes("youtube") || uri.includes("youtu.be"))
      return MusicOrigin.Youtube;

    if (uri.includes("soundcloud.com"))
      return MusicOrigin.Soundcloud;

    return null;
  }
  private resolveMusicPlayer(origin: MusicOrigin): Type<IMusicPlayer> {
    switch (origin) {
      case MusicOrigin.Youtube:
        return MusicPlayerYoutubeComponent;
      case MusicOrigin.Soundcloud:
        return MusicPlayerSoundcloudComponent;
      default:
        throw new Error("Unsupported player");
    }
  }


  private musicOriginAllowCache(musicOrigin: MusicOrigin): boolean {
    switch (musicOrigin) {
      case MusicOrigin.Youtube:
        return false;
      case MusicOrigin.Soundcloud:
        return true;
      default:
        return false;
    }
  }

  extractVideoId(url: string): string {
    const match = url.match(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([0-9A-Za-z_-]{11})/
    );
    return match ? match[1] : '';
  }
  //#endregion

  goBack(): void {
    this.location.back();
  }
}

