import { ArrowComponent, ArrowDirection } from "./arrowline/arrow/arrow.component";
import { Component, Input, OnInit, input } from '@angular/core';
import { IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { Measures, MusicDto, Notes } from './dto/music.dto';

import { ArrowlineComponent } from "./arrowline/arrowline.component";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from "@angular/router";
import { UploadPage } from "../upload/upload.page";

@Component({
  selector: 'app-game',
  templateUrl: './game.page.html',
  styleUrls: ['./game.page.scss'],
  standalone: true,
  imports: [IonIcon, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, ArrowlineComponent, ArrowComponent]
})
export class GamePage implements OnInit {
  //#region App Constants
  readonly ArrowDirection = ArrowDirection;
  readonly MAX_BARS: number = 8;
  readonly BEAT_INTERVAL = 20;
  static readonly MAX_BEAT_SUBDIVISION = 16;
  //#endregion
  //#region animations
  arrowlines: { arrows: Uint8Array, position: number, beatDivision: number }[] = [];
  lines: any[] = [];
  movingDiv: HTMLElement | null = null;
  //#endregion
  //#region Current Music
  musicDto: MusicDto | null = null;
  notesIdx: number = 0;
  currentBpm: number = 100;
  musicLength: number[] = [];
  //#endregion

  constructor(private router: Router) { }

  ngOnInit() {
    this.movingDiv = document.getElementById("arrow-container");
    this.musicDto = UploadPage.musicData;
    if (this.musicDto === null) {
      this.router.navigate(['/home']);
      return;
    }
    this.musicLength = Array.from({ length: this.musicDto.notes[this.notesIdx].stepChart.length }, (_, index) => index * this.BEAT_INTERVAL)
    console.log(this.musicLength)
    this.startLinesAnimation();
    this.loadArrows();
    this.startArrows();
  }

  startLinesAnimation(): void {
    for (let index = 0; index < this.MAX_BARS; index++) {
      this.lines.push({});
    }

  }
  trackBy(_: any, index: number) {
    return index;
  }

  loadArrows(): void {
    let timeIdx = 0;
    const notes = this.musicDto!.notes[this.notesIdx].stepChart;

    notes.forEach((measure) => {
      const measurePosition = timeIdx * this.BEAT_INTERVAL;
      const divideMeasure = (this.BEAT_INTERVAL * 4) / measure.steps.length;
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

  startArrows(): void {
    setInterval(() => {
      const currentTop = parseInt(this.movingDiv!.style.top || "0", 10);
      this.movingDiv!.style.top = `${currentTop - 10}px`;
    }, 6000 / this.currentBpm);
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

