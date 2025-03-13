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
  transform: string = '';

  constructor() {
    addIcons({ arrowUpOutline });
  }

  ngOnInit(): void {
    this.transform = this.getTransform();
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
}

export enum ArrowDirection {
  Left = 'left',
  Down = 'down',
  Up = 'up',
  Right = 'right'
}
