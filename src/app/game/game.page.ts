import { ArrowComponent, ArrowDirection } from "./arrow/arrow.component";
import { Component, NgZone, OnInit } from '@angular/core';
import { IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular/standalone';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LineComponent } from "./line/line.component";
import { MusicDto } from './dto/music.dto';

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
  MusicDto: Partial<MusicDto> = { notes: [] };

  constructor(private ngZone: NgZone) { }



  ngOnInit() {
    window.addEventListener('gamepadconnected', (event) => {
      const gamepad = event.gamepad;
      this.ngZone.run(() => {
        console.log(`Gamepad connected: ${gamepad.id}`);
      });
    });

    window.addEventListener('gamepaddisconnected', (event) => {
      this.ngZone.run(() => {
        console.log('Gamepad disconnected.');
      });
    });

    this.updateGamepadStatus();
    this.startSequence();
  }

  startSequence() {
    let second = 0;
    setInterval(() => {
      if (second < this.MusicDto.notes!.length) {
        const arrows = this.MusicDto.notes![0].stepChart[0].steps.map((value, index) => {
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

  updateGamepadStatus() {
    const gamepads = navigator.getGamepads();
    for (const gamepad of gamepads) {
      if (gamepad) {
        gamepad.buttons.forEach((button, index) => {
          if (button.pressed) {
            this.ngZone.run(() => {
              console.log(`Button ${index} pressed`);
            });
          }
        });
        gamepad.axes.forEach((axis, index) => {
          this.ngZone.run(() => {
            console.log(`Axis ${index}: ${axis}`);
          });
        });
      }
    }
    requestAnimationFrame(() => this.updateGamepadStatus());
  }


}
