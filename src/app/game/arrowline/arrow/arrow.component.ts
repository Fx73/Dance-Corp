import { Component, Input, OnInit } from '@angular/core';

import { GamePage } from '../../game.page';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowUpOutline } from 'ionicons/icons';

@Component({
  selector: 'app-arrow',
  templateUrl: './arrow.component.html',
  styleUrls: ['./arrow.component.scss'],
  imports: [IonIcon]
})
export class ArrowComponent implements OnInit {

  @Input()
  beatDivision: number = 1;
  color: string = "";

  @Input()
  direction: ArrowDirection = ArrowDirection.Up;
  transform: string = '';


  constructor() {
    addIcons({ arrowUpOutline });
  }

  ngOnInit(): void {
    this.transform = this.getTransform();
    this.color = this.getColorFilter();
  }

  getTransform(): string {
    switch (this.direction) {
      case ArrowDirection.Left:
        return 'rotate(45deg)';
      case ArrowDirection.Down:
        return 'rotate(-45deg)';
      case ArrowDirection.Up:
        return 'rotate(135deg)';
      case ArrowDirection.Right:
        return 'rotate(-135deg)';
    }
  }

  getColorFilter(): string {
    switch (this.beatDivision) {
      case 0:
        return 'sepia(1) saturate(3)  hue-rotate(350deg)'; // Orange
      case GamePage.MAX_BEAT_SUBDIVISION / 2:
        return 'sepia(1) saturate(6) brightness(0.6) hue-rotate(160deg)'; // Blue
      case GamePage.MAX_BEAT_SUBDIVISION / 4:
        return 'sepia(1) saturate(3) hue-rotate(60deg)'; // Green
      default:
        return 'sepia(1) hue-rotate(10deg)'; // Yellow
    }
  }


}

export enum ArrowDirection {
  Left = 'left',
  Down = 'down',
  Up = 'up',
  Right = 'right'
}
