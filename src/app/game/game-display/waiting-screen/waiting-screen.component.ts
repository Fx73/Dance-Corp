import { Component, EventEmitter, Input, Output, signal } from '@angular/core'

import { IonSpinner } from "@ionic/angular"

@Component({
  selector: 'app-waiting-screen',
  templateUrl: './waiting-screen.component.html',
  styleUrls: ['./waiting-screen.component.scss'],
  standalone: true,
  imports: [IonSpinner]

})
export class WaitingScreenComponent {
  @Input() title: string | undefined
  @Input() artist: string | undefined
  @Input() coverUrl: string | undefined
  @Input() level: string | undefined

  countdown = signal<number | null>(null)

  @Output() countdownFinished: EventEmitter<void> = new EventEmitter()

  startCountdown() {
    this.countdown.set(3)
    const interval = setInterval(() => {
      this.countdown.update((prev: number | null) => (prev || 0) - 1)
      if (this.countdown() === 0) {
        clearInterval(interval)
        setTimeout(() => {
          this.countdownFinished.emit()
        }, 500)
      }
    }, 1000)
  }

}
