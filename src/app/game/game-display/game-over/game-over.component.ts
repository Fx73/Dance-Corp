import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core'
import { IonBadge, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonIcon, IonItem, IonLabel, IonList } from "@ionic/angular"
import { checkmarkCircleOutline, closeCircleOutline, medalOutline, starOutline } from 'ionicons/icons'

import { Color } from 'src/app/game/constants/color'
import { CommonModule } from '@angular/common'
import { GameRound } from 'src/app/game/game-model/gameRound'
import { Precision } from 'src/app/game/constants/precision.enum'
import { addIcons } from 'ionicons'

@Component({
  selector: 'app-game-over',
  templateUrl: './game-over.component.html',
  styleUrls: ['./game-over.component.scss'],
  imports: [IonList, IonCardSubtitle, IonIcon, IonLabel, IonCardContent, IonCardHeader, IonBadge, IonCard, IonItem, CommonModule]
})
export class GameOverComponent implements OnInit {
  readonly Precision = Precision
  @Input() gameRound!: GameRound
  @Output() mainMenu: EventEmitter<void> = new EventEmitter()

  grade: { grade: string, color: string } = { grade: '', color: '' }

  personalGrades: { title: string, description: string, color: string }[] = []

  readonly precisionCounts = signal<Record<Precision, number>>({
    [Precision.Good]: 0,
    [Precision.Almost]: 0,
    [Precision.Perfect]: 0,
    [Precision.Great]: 0,
    [Precision.Missed]: 0,
    [Precision.Ok]: 0,
    [Precision.Boom]: 0,
  })

  constructor() {
    addIcons({
      'close-circle-outline': closeCircleOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'medal-outline': medalOutline,
      'star-outline': starOutline
    })
  }

  ngOnInit() {
    this.GetPrecisionCounts()
    this.grade = Color.GradeFromScore(this.GetScore(), this.gameRound.isFailed)

  }

  GetScore() {
    return Math.round(this.gameRound.score)
  }

  GetScoreFormatted() {
    return this.GetScore()
      .toLocaleString('fr-FR')
      .replace(/\u202F/g, '\u202F\u202F')
  }

  GetPrecisionCounts() {
    const counts = { ...this.precisionCounts() }

    for (const arrow of this.gameRound.arrowManager.arrowMap.values()) {
      if (arrow.precision) {
        counts[arrow.precision]++
      }
    }

    this.precisionCounts.set(counts)
  }

  GetPrecisionColor(precision: Precision): string {
    return Color.PrecisionGradient(precision)
  }

  GoToMainMenu(): void {
    this.mainMenu.emit()
  }
}
