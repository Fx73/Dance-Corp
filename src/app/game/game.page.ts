import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren, input } from '@angular/core';
import { IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { Measures, MusicDto, NotesDto } from './dto/music.dto';

import { AppComponent } from '../app.component';
import { ArrowDirection } from "../shared/enumeration/arrow-direction.enum";
import { CommonModule } from '@angular/common';
import { DomSanitizer } from "@angular/platform-browser";
import { FormsModule } from '@angular/forms';
import { GameRound } from './gameModel/gameRound';
import { Player } from './dto/player';
import { PlayerDisplayComponent } from "./player-display/player-display.component";
import { Router } from "@angular/router";
import { UserConfigService } from "../services/userconfig.service";

@Component({
  selector: 'app-game',
  templateUrl: './game.page.html',
  styleUrls: ['./game.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, PlayerDisplayComponent]
})
export class GamePage implements OnInit, OnDestroy, AfterViewInit {
  //#region App Constants
  readonly ArrowDirection = ArrowDirection;
  //#endregion
  //#region animations
  players: Player[] = [];
  //#endregion
  //#region Current Music
  music: MusicDto | null = null;
  musicLength: number[] = [];
  videoId: string = "";
  videoUrl: any;
  //#endregion

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
    if (this.music === null || notes === undefined) {
      this.router.navigate(['/home']);
      return;
    }

    this.players = this.userConfigService.players;
    console.log(this.players)

    for (const player of this.players) {
      this.gameRounds.push(new GameRound(this.music, notes, player))
    }

  }

  ngAfterViewInit() {
    this.playerDisplays = this.playerDisplaysQuery.toArray();
    this.startGame()
  }
  ngOnDestroy(): void {
  }

  startGame() {
    this.zeroTimeStamp = performance.now();
    this.gameGlobalLoop(this.zeroTimeStamp)
    console.log("Game has started")
  }


  private gameGlobalLoop(currentTimestamp: DOMHighResTimeStamp): void {
    const elapsedTime = (currentTimestamp - this.zeroTimeStamp) / 1000; // In seconds

    for (const gameRound of this.gameRounds)
      gameRound.gameLoop(elapsedTime)


    for (const playerDiplay of this.playerDisplays)
      playerDiplay.Update()

    // Schedule the next loop iteration
    requestAnimationFrame(this.gameGlobalLoop.bind(this));
  }

  private extractVideoId(url: string): string {
    const match = url.match(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([0-9A-Za-z_-]{11})/
    );
    return match ? match[1] : '';
  }


}

