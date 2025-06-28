import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { IonSpinner } from "@ionic/angular/standalone";
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-waiting-screen',
  templateUrl: './waiting-screen.component.html',
  styleUrls: ['./waiting-screen.component.scss'],
  imports: [IonSpinner, NgIf]

})
export class WaitingScreenComponent implements OnInit {
  @Input() title: string | undefined;
  @Input() artist: string | undefined;
  @Input() coverUrl: string | undefined;
  @Input() level: string | undefined;

  countdown: number | null = null;
  @Output() onCountdownFinished = new EventEmitter<void>();

  constructor() { }

  ngOnInit() { }

  startCountdown() {
    this.countdown = 3;
    const interval = setInterval(() => {
      this.countdown!--;
      if (this.countdown === 0) {
        clearInterval(interval);
        setTimeout(() => {
          this.onCountdownFinished.emit();
        }, 500);
      }
    }, 1000);
  }

}
