import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren, input } from '@angular/core';
import { IMusicPlayer, MusicOrigin } from './musicPlayer/IMusicPlayer';
import { IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { Measures, MusicDto, NotesDto } from './dto/music.dto';

import { AppComponent } from '../app.component';
import { ArrowDirection } from "../shared/enumeration/arrow-direction.enum";
import { CommonModule } from '@angular/common';
import { DomSanitizer } from "@angular/platform-browser";
import { FormsModule } from '@angular/forms';
import { GameRound } from './gameModel/gameRound';
import { MusicPlayerYoutubeComponent } from "./musicPlayer/music-player-youtube/music-player-youtube.component";
import { Player } from './dto/player';
import { PlayerDisplayComponent } from "./player-display/player-display.component";
import { Router } from "@angular/router";
import { UserConfigService } from "../services/userconfig.service";

@Component({
  selector: 'app-game',
  templateUrl: './game.page.html',
  styleUrls: ['./game.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, PlayerDisplayComponent, MusicPlayerYoutubeComponent]
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

  players: Player[] = [];

  gameRounds: GameRound[] = []
  @ViewChildren(PlayerDisplayComponent) playerDisplaysQuery!: QueryList<PlayerDisplayComponent>;
  private playerDisplays: PlayerDisplayComponent[] = [];

  zeroTimeStamp: number = 0;

  constructor(private userConfigService: UserConfigService, private router: Router, private sanitizer: DomSanitizer) { }


  ngOnInit() {
    // Get Data
    let notes: NotesDto | undefined
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.music = navigation.extras.state['music'];
      notes = navigation.extras.state['note'];
    }
    if (this.music === null || notes === undefined || this.music.music === undefined) {
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

    for (const player of this.players) {
      this.gameRounds.push(new GameRound(this.music, notes, player))
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

    // Schedule the next loop iteration
    requestAnimationFrame(this.gameGlobalLoop.bind(this));
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


}

