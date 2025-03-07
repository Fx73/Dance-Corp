import { Component, Input, OnInit } from '@angular/core';

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
  direction: ArrowDirection = ArrowDirection.Up;

  position: number = 0;
  transform: string = '';

  constructor() {
    addIcons({ arrowUpOutline });
  }

  ngOnInit(): void {
    this.position = this.getPosition();
    this.transform = this.getTransform();
  }

  getTransform(): string {
    switch (this.direction) {
      case ArrowDirection.Left:
        return 'rotate(-90deg)';
      case ArrowDirection.Down:
        return 'rotate(180deg)';
      case ArrowDirection.Right:
        return 'rotate(90deg)';
      default:
        return 'rotate(0deg)';
    }
  }

  getPosition(): number {
    switch (this.direction) {
      case ArrowDirection.Left:
        return 0;
      case ArrowDirection.Down:
        return 25;
      case ArrowDirection.Up:
        return 50;
      case ArrowDirection.Right:
        return 75;
      default:
        return 0;
    }
  }
}

export enum ArrowDirection {
  Left = 'left',
  Down = 'down',
  Up = 'up',
  Right = 'right'
}
