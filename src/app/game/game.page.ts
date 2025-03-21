import { ArrowComponent, ArrowDirection } from "./arrowline/arrow/arrow.component";
import { Component, Input, OnInit, input } from '@angular/core';
import { IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { Measures, MusicDto, Notes } from './dto/music.dto';

import { ArrowlineComponent } from "./arrowline/arrowline.component";
import { CommonModule } from '@angular/common';
import { DomSanitizer } from "@angular/platform-browser";
import { FormsModule } from '@angular/forms';
import { Router } from "@angular/router";

@Component({
  selector: 'app-game',
  templateUrl: './game.page.html',
  styleUrls: ['./game.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, ArrowlineComponent]
})
export class GamePage implements OnInit {
  //#region App Constants
  readonly ArrowDirection = ArrowDirection;
  readonly BEAT_INTERVAL = 150; //en px
  readonly MEASURE_INTERVAL = 4 * this.BEAT_INTERVAL;
  static readonly MAX_BEAT_SUBDIVISION = 16;
  readonly showBars = true
  //#endregion
  //#region animations
  arrowlines: { arrows: Uint8Array, position: number, beatDivision: number }[] = [];
  lines: any[] = [];
  movingDiv: HTMLElement | null = null;
  //#endregion
  //#region Current Music
  music: MusicDto | null = null;
  notes: Notes | null = null;
  notesIdx: number = 1;
  currentBpms: number = 0.002; //Beat per milliseconds
  musicLength: number[] = [];
  videoId: string = "";
  videoUrl: any;
  //#endregion

  constructor(private router: Router, private sanitizer: DomSanitizer) { }

  ngOnInit() {
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

    this.videoId = this.extractVideoId(this.music?.music ?? "https://youtu.be/u3VFzuUiTGw?si=R_6yFkX2eRHR7YN9")
    this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/' + this.videoId + '?si=w_PIhwe7FnixTNr_&controls=0&autoplay=1')

    if (this.showBars)
      this.musicLength = Array.from({ length: this.notes.stepChart.length * 4 }, (_, index) => (index * this.BEAT_INTERVAL + 30))
    this.currentBpms = this.music.bpms[0].bpm / 60000
    this.loadArrows();
    this.startArrows();
  }

  loadArrows(): void {
    let timeIdx = 0;
    const notes = this.notes!.stepChart;

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
    console.log(this.arrowlines)
  }

  startArrows(): void {
    let lastChrono: number | undefined;

    const animate = (chrono: number) => {
      if (lastChrono === undefined) {
        lastChrono = chrono;
      } else {
        const timeElapsed = chrono - lastChrono;
        lastChrono = chrono;

        // Calculate new position
        const currentTop = parseInt(this.movingDiv!.style.top || "0", 10);
        const newTop = currentTop - (timeElapsed * this.currentBpms * this.BEAT_INTERVAL);
        this.movingDiv!.style.top = `${newTop}px`;
      }

      window.requestAnimationFrame(animate);
    };
    window.requestAnimationFrame(animate);
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

