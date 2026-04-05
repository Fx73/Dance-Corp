import { ActivatedRoute, Router } from "@angular/router";
import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { IMusicPlayer, MusicOrigin, MusicPlayerCommon } from './music-player/IMusicPlayer';
import { IonButton, IonCard, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular/standalone';

import { AnnouncerService } from 'src/app/services/gameplay/announcer.service';
import { AppComponent } from '../app.component';
import { ArrowDirection } from "./constants/arrow-direction.enum";
import { FormsModule } from '@angular/forms';
import { GameManager } from './game.manager';
import { GameOverComponent } from "./game-display/game-over/game-over.component";
import { MusicCacheService } from '../services/local-storage/music.cache.service';
import { MusicDto } from "./game-model/music.dto";
import { MusicPlayerLocalComponent } from "./music-player/music-player-local/music-player-local.component";
import { MusicPlayerSoundcloudComponent } from './music-player/music-player-soundcloud/music-player-soundcloud.component';
import { MusicPlayerYoutubeComponent } from "./music-player/music-player-youtube/music-player-youtube.component";
import { PlayerDisplayComponent } from "./game-display/player-display.component";
import { PresenceService } from '../services/thirdpartyapp/presence.service';
import { UserCacheService } from '../services/local-storage/user.cache.service';
import { UserConfigService } from "src/app/services/userconfig.service";
import { WaitingScreenComponent } from "./game-display/waiting-screen/waiting-screen.component";
import { addIcons } from 'ionicons';
import { arrowBack } from 'ionicons/icons';

@Component({
  selector: 'app-game',
  templateUrl: './game.page.html',
  styleUrls: ['./game.page.scss'],
  standalone: true,
  imports: [IonIcon, IonCard, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, PlayerDisplayComponent, GameOverComponent, WaitingScreenComponent, MusicPlayerYoutubeComponent, MusicPlayerSoundcloudComponent, MusicPlayerLocalComponent, IonButton]
})
export class GamePage implements OnInit, OnDestroy, AfterViewInit {
  //#region App Constants
  readonly ArrowDirection = ArrowDirection;
  readonly MusicOrigin = MusicOrigin;
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

  constructor(private cdr: ChangeDetectorRef, private route: ActivatedRoute, private userConfigService: UserConfigService, private userCacheService: UserCacheService, private musicCacheService: MusicCacheService, private router: Router, private location: Location, private announcerService: AnnouncerService, private discordRpcService: PresenceService) {
    addIcons({ arrowBack });
  }


  ngOnInit() {
    // Get Data
    const musicId = this.route.snapshot.paramMap.get('musicId');
    const selectedNotes = this.route.snapshot.queryParamMap.get('notes')?.split(',').map(n => +n);

    if (!musicId || !selectedNotes || selectedNotes.length === 0) {
      console.error("Music data is missing or incomplete.");
      this.router.navigate(['/home']);
      return;
    }

    const music = this.musicCacheService.getMusic(musicId);
    if (!music) {
      console.error(`Music with ID ${musicId} not found. Your cache might be corrupted.`);
      this.router.navigate(['/home']);
      return;
    }
    this.music = music;

    // Prepare Music Player
    this.musicOrigin = MusicPlayerCommon.pickMusicPlayer(this.music.music!)
    if (this.musicOrigin == null) {
      AppComponent.presentWarningToast("Error loading music in player !")
      this.router.navigate(['/home']);
      return;
    }

    const players = this.userConfigService.players;
    const isTrainingMode: boolean = this.userConfigService.getConfig()["trainingMode"] ?? false
    this.game = new GameManager(this.music, players, selectedNotes, isTrainingMode, this.userCacheService, this.announcerService);
    this.announcerService.pickPreferredAnnouncer()

    this.discordRpcService.update("Dancing on lvl " + this.music.noteData[0].meter, this.music.title + " - " + this.music.artist)
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
    if (this.hasGameBeenInitialized) return;
    this.hasGameBeenInitialized = true;

    this.game!.registerExternalComponents(this.musicPlayer, /*this.playerDisplays*/);

    this.waitingScreen.startCountdown();
    this.announcerService.playCountdownFromAnnouncer()

    this.cdr.detectChanges();
  }

  handleCountdownFinished() {
    this.loadingMusic = false;
    this.game?.startGame();
  }


  ngOnDestroy(): void {
    try {
      this.game?.musicPlayer.stop();
    } catch (e) {
      console.warn("Error stopping music player on game destroy:", e);
    }
    this.game?.destroyGame();
    this.game = null;
    console.log("Game destroyed");
  }


  goBack(): void {
    this.location.back();
  }

}

