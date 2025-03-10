import { ArrowComponent, ArrowDirection } from "./arrow/arrow.component";
import { Component, OnInit } from '@angular/core';
import { IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular/standalone';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LineComponent } from "./line/line.component";
import { MusicDto } from './dto/music.dto';
import { UploadPage } from "../upload/upload.page";

@Component({
  selector: 'app-game',
  templateUrl: './game.page.html',
  styleUrls: ['./game.page.scss'],
  standalone: true,
  imports: [IonIcon, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, ArrowComponent, LineComponent]
})
export class GamePage implements OnInit {
  ArrowDirection = ArrowDirection;
  lines: { arrows: { direction: ArrowDirection }[], time: number }[] = [];
  musicDto: MusicDto | null = null;

  constructor() { }

  ngOnInit() {
    this.musicDto = UploadPage.musicData;
    if (this.musicDto)
      this.startSequence();
  }

  startSequence() {
    let second = 0;
    setInterval(() => {
      if (second < this.musicDto!.notes!.length) {
        const arrows = this.musicDto!.notes![0].stepChart[0].steps.map((value, index) => {
          return value[0] === 1 ? { direction: this.getDirection(index) } : null;
        }).filter(arrow => arrow !== null);
        this.lines.push({ arrows, time: Date.now() });
        second++;
      }
    }, 1000);
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
