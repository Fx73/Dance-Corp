import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, input } from '@angular/core';
import { IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { Measures, MusicDto, NotesDto } from './dto/music.dto';

import { AppComponent } from '../app.component';
import { ArrowDirection } from "../shared/enumeration/arrow-direction.enum";
import { ArrowlineComponent } from "./arrowline/arrowline.component";
import { CommonModule } from '@angular/common';
import { DomSanitizer } from "@angular/platform-browser";
import { FormsModule } from '@angular/forms';
import { KeyboardGamepad } from './keyboardGamepad';
import { Player } from './dto/player';
import { Router } from "@angular/router";
import { UserConfigService } from "../services/userconfig.service";
import { timestamp } from 'rxjs';

@Component({
  selector: 'app-game',
  templateUrl: './game.page.html',
  styleUrls: ['./game.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, ArrowlineComponent]
})
export class GamePage implements OnInit, OnDestroy {
  //#region App Constants
  readonly ArrowDirection = ArrowDirection;
  readonly BEAT_INTERVAL = 150; //en px
  readonly MEASURE_INTERVAL = 4 * this.BEAT_INTERVAL;
  static readonly MAX_BEAT_SUBDIVISION = 16;
  //#endregion
  //#region animations
  arrowlines: { arrows: Uint8Array, position: number, beatDivision: number }[] = [];
  arrowTargets: Map<ArrowDirection, HTMLElement> = new Map();
  @ViewChild('arrowLeft', { static: true }) arrowLeft!: ElementRef<HTMLImageElement>;
  @ViewChild('arrowDown', { static: true }) arrowDown!: ElementRef<HTMLImageElement>;
  @ViewChild('arrowUp', { static: true }) arrowUp!: ElementRef<HTMLImageElement>;
  @ViewChild('arrowRight', { static: true }) arrowRight!: ElementRef<HTMLImageElement>;
  lines: any[] = [];
  movingDiv: HTMLElement | null = null;
  keyboardGamePads: Map<number, KeyboardGamepad> = new Map<number, KeyboardGamepad>();
  //#endregion
  //#region Current Music
  music: MusicDto | null = null;
  notes: NotesDto | null = null;
  notesIdx: number = 1;
  currentBpms: number = 0.002; //Beat per milliseconds
  musicLength: number[] = [];
  videoId: string = "";
  videoUrl: any;
  //#endregion

  constructor(private userConfigService: UserConfigService, private router: Router, private sanitizer: DomSanitizer) { }


  ngOnInit() {
    // Get Data
    this.movingDiv = document.getElementById("arrow-container");
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.music = navigation.extras.state['music'];
      this.notes = navigation.extras.state['note'];
      console.log('Music received:', this.music);
      console.log('Note received:', this.notes);
    }
    if (this.music === null || this.notes === null) {
      this.router.navigate(['/home']);
      return;
    }
    this.currentBpms = this.music.bpms[0].bpm / 60000

    // Init game controllers
    for (const p of this.userConfigService.players) {
      if (p.gamepad!.index === -1) {
        this.keyboardGamePads.set(p.id, new KeyboardGamepad(p.keyboardBindings))
      }
    }

    //Build Game
    this.loadTargets()
    this.loadArrows();

    // Init Music
    this.videoId = this.extractVideoId(this.music?.music ?? "https://youtu.be/u3VFzuUiTGw?si=R_6yFkX2eRHR7YN9")
    this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/' + this.videoId + '?si=w_PIhwe7FnixTNr_&controls=0&autoplay=1')

    this.gameStart();
  }
  ngOnDestroy(): void {
    this.keyboardGamePads.forEach(k => k.destroy())
    this.keyboardGamePads.clear()
  }

  loadTargets() {
    this.arrowTargets.set(ArrowDirection.Left, this.arrowLeft.nativeElement);
    this.arrowTargets.set(ArrowDirection.Down, this.arrowDown.nativeElement);
    this.arrowTargets.set(ArrowDirection.Up, this.arrowUp.nativeElement);
    this.arrowTargets.set(ArrowDirection.Right, this.arrowRight.nativeElement);
  }

  loadArrows(): void {
    let timeIdx = 0;
    const notes = this.notes!.stepChart;

    if (this.userConfigService.getConfig()["showBars"])
      this.musicLength = Array.from({ length: notes.length * 4 }, (_, index) => (index * this.BEAT_INTERVAL + 30))

    notes.forEach((measure) => {
      const measurePosition = timeIdx * this.MEASURE_INTERVAL;
      const divideMeasure = this.MEASURE_INTERVAL / measure.steps.length;
      const baseDivisionFactor = GamePage.MAX_BEAT_SUBDIVISION / measure.steps.length;
      const quarterLength = measure.steps.length / 4;

      measure.steps.forEach((line, stepIdx) => {
        const arrows = new Uint8Array(Array.from(line, c => parseInt(c.toString(), 10)));
        const linePosition = measurePosition + stepIdx * divideMeasure;
        this.arrowlines.push({
          arrows,
          position: linePosition,
          beatDivision: (stepIdx % quarterLength) * baseDivisionFactor
        });
      });

      timeIdx++;
    });
  }


  timeStampZero: DOMHighResTimeStamp = performance.now();
  gameStart() {
    this.timeStampZero = performance.now();
    this.movingDiv!.style.top = 200 + "px"
    window.requestAnimationFrame(this.gameLoop.bind(this));
  }

  gameLoop(timeStamp: DOMHighResTimeStamp) {

    // Watch for inputs
    const gamepads = navigator.getGamepads();
    for (const player of this.userConfigService.players) {
      let gamepad: Gamepad | KeyboardGamepad | null;
      if (player.gamepad!.index! === -1) {//keyboard
        gamepad = this.keyboardGamePads.get(player.id) || null
      }
      else {
        gamepad = gamepads[player.gamepad!.index!];
      }
      if (gamepad) {
        for (const [action, key] of player.keyBindings) {
          this.performAction(action, gamepad.buttons[key].pressed)
        }
      }
      else
        AppComponent.presentWarningToast("Gamepad Lost! Reconnect it!")
    }

    // Calculate new position
    const timeElapsed = timeStamp - this.timeStampZero;
    const newTop = timeElapsed * this.currentBpms * this.BEAT_INTERVAL - (this.BEAT_INTERVAL * 6)
    this.movingDiv!.style.top = `-${newTop}px`;

    window.requestAnimationFrame(this.gameLoop.bind(this));
  }


  performAction(action: ArrowDirection, isPressed: boolean) {
    const arrowTarget = this.arrowTargets.get(action);
    if (!arrowTarget) {
      console.error(`No arrow element found for action "${action}"`);
      return;
    }
    if (isPressed) {
      arrowTarget.classList.add('active');
    } else {
      arrowTarget.classList.remove('active');
    }
  }



  getDirection(index: number): ArrowDirection {
    switch (index) {
      case 0:
        return ArrowDirection.Left;
      case 1:
        return ArrowDirection.Down;
      case 2:
        return ArrowDirection.Up;
      case 3:
        return ArrowDirection.Right;
      default:
        return ArrowDirection.Up;
    }
  }

  private extractVideoId(url: string): string {
    const match = url.match(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([0-9A-Za-z_-]{11})/
    );
    return match ? match[1] : '';
  }


}

