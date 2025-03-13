import { ArrowComponent, ArrowDirection } from "./arrowline/arrow/arrow.component";
import { Component, Input, OnInit, input } from '@angular/core';
import { IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { Measures, MusicDto, Notes } from './dto/music.dto';

import { ArrowlineComponent } from "./arrowline/arrowline.component";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UploadPage } from "../upload/upload.page";

@Component({
  selector: 'app-game',
  templateUrl: './game.page.html',
  styleUrls: ['./game.page.scss'],
  standalone: true,
  imports: [IonIcon, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, ArrowlineComponent, ArrowComponent]
})
export class GamePage implements OnInit {
  //#region Constants
  readonly ArrowDirection = ArrowDirection;
  readonly MAX_BARS: number = 8;
  //#endregion
  //#region animations
  arrowlines: { arrows: Uint8Array, position: number }[] = [];
  lines: any[] = [];
  //#endregion
  musicDto: MusicDto | null = null;
  notesDto: number[][] = [];
  movingDiv: HTMLElement | null = null;

  notesIdx: number = 0;

  speed: number = 6000;
  interval: number = 1000;

  constructor() { }

  ngOnInit() {
    this.movingDiv = document.getElementById("arrow-container");
    this.musicDto = UploadPage.musicData;
    if (this.musicDto === null) {
      return
    }
    this.interval = 60000 / this.musicDto.bpms[0].bpm;
    this.speed = this.interval * 6;
    this.notesDto = this.LoadStepChart(this.musicDto.notes[this.notesIdx].stepChart);
    this.startLinesAnimation();
    this.loadArrows();
    this.startArrows();
  }

  private LoadStepChart(stepChart: Measures[]): number[][] {
    const normalizedStepChart: number[][] = [];
    stepChart.forEach(measure => {
      const stepadd = 16 / measure.steps.length - 1; // 16 = Normalize to quarter of second
      for (let i = 0; i < measure.steps.length; i++) {
        normalizedStepChart.push(measure.steps[i]);
        for (let i = 0; i < stepadd; i++)
          normalizedStepChart.push([]);
      }
    });
    return normalizedStepChart;
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
    const quarterNote = (this.interval / this.speed) * 100;
    let timeIdx = 0;
    const notes = this.musicDto!.notes[this.notesIdx].stepChart;

    notes.forEach((measure) => {
      const measurePosition = timeIdx * quarterNote;
      const divideNote = quarterNote * (1 / measure.steps.length);

      measure.steps.forEach((line, stepIdx) => {
        const linePosition = measurePosition + stepIdx * divideNote;
        const arrows = new Uint8Array(Array.from(line, c => parseInt(c.toString(), 10)));
        this.arrowlines.push({
          arrows,
          position: linePosition,
        });
      });

      timeIdx++;
    });
  }

  startArrows(): void {
    setInterval(() => {
      const currentTop = parseInt(this.movingDiv!.style.top || "0", 10);
      this.movingDiv!.style.top = `${currentTop - 10}px`;
    }, 20);
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

