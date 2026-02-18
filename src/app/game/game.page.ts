import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { IMusicPlayer, MusicOrigin, MusicPlayerCommon } from './musicPlayer/IMusicPlayer';
import { IonCard, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

import { AppComponent } from '../app.component';
import { ArrowDirection } from "./constants/arrow-direction.enum";
import { FormsModule } from '@angular/forms';
import { GameManager } from './game.manager';
import { GameOverComponent } from "./gameDisplay/game-over/game-over.component";
import { MusicCacheService } from './../services/dataCache/music.cache.service';
import { MusicDto } from './gameModel/music.dto';
import { MusicPlayerSoundcloudComponent } from './musicPlayer/music-player-soundcloud/music-player-soundcloud.component';
import { MusicPlayerYoutubeComponent } from "./musicPlayer/music-player-youtube/music-player-youtube.component";
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
  imports: [IonCard, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, PlayerDisplayComponent, GameOverComponent, WaitingScreenComponent, MusicPlayerYoutubeComponent, MusicPlayerSoundcloudComponent]
})
export class GamePage implements OnInit, OnDestroy, AfterViewInit {
  //#region App Constants
  readonly ArrowDirection = ArrowDirection;
  readonly MusicOrigin = MusicOrigin;
  readonly backgroundUrl: string = "assets/Splash/Texture.png";
  //#endregion

  //#region Loading
  loadingMusic: boolean = true;
  @ViewChild(WaitingScreenComponent) waitingScreen!: WaitingScreenComponent;
  //#endregion

  //#region Game
  game: GameManager | null = null;
  music: MusicDto | null = null;
  musicOrigin: MusicOrigin | null = null
  //#endregion

  constructor(private cdr: ChangeDetectorRef, private userConfigService: UserConfigService, private userFirestoreService: UserFirestoreService, private musicCacheService: MusicCacheService, private router: Router, private location: Location) { }


  ngOnInit() {
    // Get Data
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.music = navigation.extras.state['music'];
    }
    if (this.music === null || this.music.music === undefined || this.music.noteData.length === 0) {
      console.error("Music data is missing or incomplete.");
      this.router.navigate(['/home']);
      return;
    }

    // Prepare Music Player
    this.musicOrigin = MusicPlayerCommon.pickMusicPlayer(this.music!.music!)
    if (this.musicOrigin == null) {
      AppComponent.presentWarningToast("Error loading music in player !")
      this.router.navigate(['/home']);
      return;
    }

    const players = this.userConfigService.players;
    const isTrainingMode: boolean = this.userConfigService.getConfig()["trainingMode"] ?? false
    this.game = new GameManager(this.music!, players, isTrainingMode, this.userFirestoreService);
  }

  @ViewChildren(PlayerDisplayComponent) playerDisplaysQuery!: QueryList<PlayerDisplayComponent>;
  private playerDisplays: PlayerDisplayComponent[] = [];
  ngAfterViewInit() {
    this.playerDisplays = this.playerDisplaysQuery.toArray();
    console.log("Player Displays initialized:", this.playerDisplays, this.musicPlayer);
    if (this.musicPlayer && this.playerDisplays.length > 0)
      this.initGame();
  }

  private musicPlayer!: IMusicPlayer;
  onPlayerReady(mPlayer: IMusicPlayer) {
    this.musicPlayer = mPlayer;
    console.log("Music Player is ready:", this.musicPlayer, this.playerDisplays);
    if (this.musicPlayer && this.playerDisplays.length > 0)
      this.initGame();
  }

  private hasGameBeenInitialized = false;
  initGame() {
    console.log("Initializing game with music:", this.music?.music);
    if (this.hasGameBeenInitialized) return;
    this.hasGameBeenInitialized = true;

    this.game!.registerExternalComponents(this.musicPlayer, /*this.playerDisplays*/);

    this.waitingScreen.startCountdown();
    this.cdr.detectChanges();
  }

  handleCountdownFinished() {
    this.loadingMusic = false;
    this.game?.startGame();
  }


  ngOnDestroy(): void {
    this.game?.gameDestroy();
    this.location

  }


  goBack(): void {
    this.location.back();
  }
}

