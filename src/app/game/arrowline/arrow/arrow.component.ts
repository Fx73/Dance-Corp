import { Component, Input, OnInit } from '@angular/core';

import { GamePage } from '../../game.page';

@Component({
  selector: 'app-arrow',
  templateUrl: './arrow.component.html',
  styleUrls: ['./arrow.component.scss'],
  imports: []
})
export class ArrowComponent implements OnInit {

  @Input()
  beatDivision: number = 1;
  color: string = "";

  @Input()
  direction: ArrowDirection = ArrowDirection.Up;
  transform: string = '';


  constructor() {
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

  readonly firstSubdivision = GamePage.MAX_BEAT_SUBDIVISION / 8;
  readonly secondSubdivision1 = GamePage.MAX_BEAT_SUBDIVISION / 16;
  readonly secondSubdivision2 = 3 * GamePage.MAX_BEAT_SUBDIVISION / 16;

  getColorFilter(): string {
    switch (this.beatDivision) {
      case 0:
        return 'sepia(1) saturate(3)  hue-rotate(330deg)'; // Orange
      case this.firstSubdivision:
        return 'sepia(1) saturate(6) brightness(0.6) hue-rotate(160deg)'; // Blue
      case this.secondSubdivision1: case this.secondSubdivision2:
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
