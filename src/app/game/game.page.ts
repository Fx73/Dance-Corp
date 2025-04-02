import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren, input } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { IMusicPlayer, MusicOrigin } from './musicPlayer/IMusicPlayer';
import { IonButton, IonCard, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { MusicDto, NotesDto } from './gameModel/music.dto';

import { AppComponent } from '../app.component';
import { ArrowDirection } from "./constants/arrow-direction.enum";
import { FormsModule } from '@angular/forms';
import { GameOverComponent } from "./game-over/game-over.component";
import { GameRound } from './gameModel/gameRound';
import { MusicPlayerYoutubeComponent } from "./musicPlayer/music-player-youtube/music-player-youtube.component";
import { Player } from './gameModel/player';
import { PlayerDisplayComponent } from "./player-display/player-display.component";
import { Router } from "@angular/router";
import { UserConfigService } from "src/app/services/userconfig.service";
import { UserFirestoreService } from 'src/app/services/firestore/user.firestore.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.page.html',
  styleUrls: ['./game.page.scss'],
  standalone: true,
  imports: [IonCard, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, PlayerDisplayComponent, MusicPlayerYoutubeComponent, GameOverComponent]
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
  //#endregion


  @ViewChildren(PlayerDisplayComponent) playerDisplaysQuery!: QueryList<PlayerDisplayComponent>;
  private playerDisplays: PlayerDisplayComponent[] = [];

  players: Player[] = [];
  gameRounds: GameRound[] = []

  public isGameOver: Boolean = false
  private gameLoopId: number | null = null;
  zeroTimeStamp: number = 0;

  constructor(private userConfigService: UserConfigService, private userFirestoreService: UserFirestoreService, private router: Router, private location: Location) { }


  ngOnInit() {
    // Get Data
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.music = navigation.extras.state['music'];
    }
    if (this.music === null || this.music.music === undefined || this.music.notes.length === 0) {
      this.router.navigate(['/home']);
      return;
    }

    const musicOrigin = this.pickMusicPlayer(this.music!.music!)
    if (musicOrigin == null) {
      AppComponent.presentWarningToast("Error loading music in player !")
    } else {
      this.musicOrigin = musicOrigin
    }

    this.players = this.userConfigService.players;
    const isTrainingMode: boolean = this.userConfigService.getConfig()["trainingMode"] ?? false

    for (const player of this.players) {
      this.gameRounds.push(new GameRound(this.music, this.music.notes[0], player, isTrainingMode))
    }
  }

  ngAfterViewInit() {
    this.playerDisplays = this.playerDisplaysQuery.toArray();
    if (this.musicPlayer)
      this.startGame()
  }

  onPlayerReady(player: IMusicPlayer) {
    this.musicPlayer = player
    if (this.playerDisplays.length > 0)
      this.startGame()

  }

  ngOnDestroy(): void {
    if (this.gameLoopId !== null) {
      cancelAnimationFrame(this.gameLoopId);
    }
    this.gameRounds = [];
  }

  startGame() {
    this.musicPlayer.play()
    this.zeroTimeStamp = Math.round(performance.now()) + (this.music!.beat0OffsetInSeconds ?? 0) * 1000;
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
      this.userFirestoreService.updateUserStatsFromRound(this.music!.id, this.music?.notes[0].chartName!, gameRound)
  }

  //#region Music Player
  private pickMusicPlayer(uri: string): MusicOrigin | null {
    if (uri.includes("youtube") || uri.includes("youtu.be"))
      return MusicOrigin.Youtube
    return null
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

