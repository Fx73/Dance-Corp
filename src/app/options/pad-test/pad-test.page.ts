import { Component, NgZone, OnInit } from '@angular/core';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

import { AppComponent } from 'src/app/app.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GamepadService } from 'src/app/services/gamepad.service';
import { HeaderComponent } from "../../shared/header/header.component";

@Component({
  selector: 'app-pad-test',
  templateUrl: './pad-test.page.html',
  styleUrls: ['./pad-test.page.scss'],
  standalone: true,
  imports: [IonButton, IonCardContent, IonCardTitle, IonCard, IonCardHeader, IonContent, CommonModule, FormsModule, HeaderComponent]
})
export class PadTestPage {

  constructor(public gamepadService: GamepadService) { }

  ngOnInit(): void {
    this.startPollingGamepad();
  }

  private startPollingGamepad(): void {
    const poll = () => {
      this.gamepadService.updateGamepadState(); // Mettre à jour l'état du gamepad
      requestAnimationFrame(poll);
    };
    poll();
  }
}

