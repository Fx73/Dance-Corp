import { ArrowComponent, ArrowDirection } from "./arrow/arrow.component";
import { Component, OnInit } from '@angular/core';
import { IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { MusicDto, Notes } from './dto/music.dto';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LineComponent } from "./line/line.component";
import { UploadPage } from "../upload/upload.page";

@Component({
  selector: 'app-game',
  templateUrl: './game.page.html',
  styleUrls: ['./game.page.scss'],
  standalone: true,
  imports: [IonIcon, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, ArrowComponent, LineComponent]
})
export class GamePage implements OnInit {
  //#region Constants
  readonly ArrowDirection = ArrowDirection;
  readonly MAX_BARS: number = 12;
  //#endregion
  //#region animations
  arrowlines: { arrows: { direction: ArrowDirection }[], time: number }[] = [];
  lines: any[] = [];
  //#endregion
  musicDto: MusicDto | null = null;
  notesDto: Notes | undefined;
  notesIdx: number = 0;

  speed: number = 3000;
  interval: number = 500;

  constructor() { }

  ngOnInit() {
    this.startLinesAnimation();
    this.musicDto = UploadPage.musicData;
    if (this.musicDto === null) {
      return
    }
    this.notesDto = this.musicDto.notes[this.notesIdx];
    this.interval = 60000 / this.musicDto.bpms[0].bpm;
    this.speed = this.interval * 6;
    this.startLinesAnimation();
    this.startSequence();
  }

  startLinesAnimation(): void {
    setInterval(() => {
      if (this.lines.length >= this.MAX_BARS) {
        this.lines.shift(); // Supprime la barre la plus ancienne
      }
      this.lines.push({}); // Ajoute une nouvelle barre
    }, this.interval);
  }

  startSequence() {
    if (this.notesDto === undefined)
      return;

    setInterval(() => {
    }, 1000);

    let measure = 0;
    setInterval(() => {
      let time = 0;
      setInterval(() => {
        const arrows = this.notesDto!.stepChart[measure].steps.map((row, index) => {
          return row.some(step => step === 1) ? { direction: this.getDirection(index) } : null;
        }).filter(arrow => arrow !== null);

        this.arrowlines.push({ arrows, time: Date.now() });
        time++;
      }, 1000);
      measure++;
    }, 4000);

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


}
function assert(arg0: boolean, arg1: string) {
  throw new Error("Function not implemented.");
}

