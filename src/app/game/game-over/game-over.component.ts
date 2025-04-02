import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IonBadge, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonIcon, IonItem, IonLabel, IonList } from "@ionic/angular/standalone";
import { checkmarkCircleOutline, closeCircleOutline, medalOutline, starOutline } from 'ionicons/icons';

import { Color } from '../constants/color';
import { CommonModule } from '@angular/common';
import { GameRound } from '../gameModel/gameRound';
import { Precision } from '../constants/precision.enum';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-game-over',
  templateUrl: './game-over.component.html',
  styleUrls: ['./game-over.component.scss'],
  imports: [IonList, IonCardSubtitle, IonIcon, IonLabel, IonCardContent, IonCardTitle, IonCardHeader, IonBadge, IonCard, IonItem, CommonModule]
})
export class GameOverComponent implements OnInit {
  readonly Precision = Precision;
  @Input() gameRound!: GameRound;
  @Output() mainMenu = new EventEmitter<void>();

  readonly precisionCounts: { [key in Precision]: number } = {
    [Precision.Good]: 0,
    [Precision.Almost]: 0,
    [Precision.Perfect]: 0,
    [Precision.Great]: 0,
    [Precision.Missed]: 0,
    [Precision.Ok]: 0,
  };

  constructor() {
    addIcons({
      'close-circle-outline': closeCircleOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'medal-outline': medalOutline,
      'star-outline': starOutline
    });
  }

  ngOnInit() {
    this.getPrecisionCounts()
  }

  getPrecisionCounts(): { [key in Precision]: number } {
    for (const arrow of this.gameRound.arrowMap.values()) {
      if (arrow.precision! in this.precisionCounts) {
        if (arrow.precision)
          this.precisionCounts[arrow.precision]++;
      }
    }

    return this.precisionCounts;
  }

  getPrecisionColor(precision: Precision): string {
    return Color.precisionGradient(precision)
  }

  goToMainMenu(): void {
    this.mainMenu.emit(); // Notifie le parent pour aller au menu principal
  }
}
