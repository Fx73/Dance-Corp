import { ArrowComponent, ArrowDirection } from "./arrowline/arrow/arrow.component";
import { Component, Input, OnInit, input } from '@angular/core';
import { IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { Measures, MusicDto, Notes } from './dto/music.dto';

import { ArrowlineComponent } from "./arrowline/arrowline.component";
import { CommonModule } from '@angular/common';
import { DomSanitizer } from "@angular/platform-browser";
import { FormsModule } from '@angular/forms';
import { Router } from "@angular/router";
import { UploadPage } from "../upload/upload.page";

declare let YT: any;

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
  musicDto: MusicDto | null = null;
  notesIdx: number = 1;
  currentBpm: number = 100;
  musicLength: number[] = [];
  videoId: string = "";
  videoUrl: any;
  //#endregion

  constructor(private router: Router, private sanitizer: DomSanitizer) { }

  ngOnInit() {
    this.movingDiv = document.getElementById("arrow-container");
    this.musicDto = UploadPage.musicData;
    this.videoId = this.extractVideoId(this.musicDto?.music ?? "https://youtu.be/u3VFzuUiTGw?si=R_6yFkX2eRHR7YN9")
    console.log(this.videoId)
    this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/' + this.videoId + '?si=w_PIhwe7FnixTNr_&controls=0&autoplay=1')
    console.log(this.videoId)
    if (this.musicDto === null) {
      //this.router.navigate(['/home']);
      return;
    }
    if (this.showBars)
      this.musicLength = Array.from({ length: this.musicDto.notes[this.notesIdx].stepChart.length * 4 }, (_, index) => (index * this.BEAT_INTERVAL + 30))
    this.loadArrows();
    this.startArrows();
  }

  loadArrows(): void {
    let timeIdx = 0;
    const notes = this.musicDto!.notes[this.notesIdx].stepChart;

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

  startArrows(): void {
    const frameInterval = 60000 / (this.currentBpm * this.BEAT_INTERVAL)
    const moveArrow = setInterval(() => {
      const currentTop = parseInt(this.movingDiv!.style.top || "0", 10);
      this.movingDiv!.style.top = `${currentTop - 1}px`;
    }, frameInterval);
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


  startYouTubeBackgroundMusic(url: string): void {
    const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    const videoId = match ? match[1] : '';

    function onYouTubeIframeAPIReady() {
      new YT.Player('youtube-player', {
        height: '0',
        width: '0',
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          showinfo: 0,
          modestbranding: 1,
          loop: 1,
          fs: 0,
        },
        events: {
          onReady: (event: { target: { mute: () => void; playVideo: () => void; }; }) => {
            event.target.playVideo();
          },
        },
      });
    }

    // Charger l'API YouTube
    if (!document.getElementById('youtube-script')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    }
  }

  private extractVideoId(url: string): string {
    const match = url.match(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([0-9A-Za-z_-]{11})/
    );
    return match ? match[1] : '';
  }



}

