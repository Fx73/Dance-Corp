import { AlertController, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonHeader, IonItem, IonLabel, IonSelect, IonSelectOption, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { Component, NgZone, OnInit } from '@angular/core';

import { AppComponent } from 'src/app/app.component';
import { ArrowDirection } from 'src/app/shared/enumeration/arrow-direction.enum';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GamepadService } from 'src/app/services/gamepad.service';
import { HeaderComponent } from "../../shared/header/header.component";
import { Player } from 'src/app/game/dto/player';
import { UserConfigService } from 'src/app/services/userconfig.service';

@Component({
  selector: 'app-pad-test',
  templateUrl: './pad-test.page.html',
  styleUrls: ['./pad-test.page.scss'],
  standalone: true,
  imports: [IonCardSubtitle, IonItem, IonLabel, IonButton, IonCardContent, IonCardTitle, IonCard, IonCardHeader, IonSelect, IonSelectOption, IonContent, CommonModule, FormsModule, HeaderComponent]
})
export class PadTestPage {
  readonly arrowKeys = Object.values(ArrowDirection)
  playerSelected: Player | undefined;

  waitingForInput: boolean = false;

  constructor(
    public gamepadService: GamepadService,
    public userConfigService: UserConfigService,
    private alertController: AlertController
  ) { }

  ngOnInit(): void {
  }

  updateGamepad(playerIndex: number, gamepadId: string): void {
    const gamepad = this.gamepadService.getGamepads().find(g => g.id === gamepadId)
    if (gamepad)
      this.userConfigService.updatePlayer('gamepad', playerIndex, { index: gamepad.index, id: gamepad.id });
    else
      AppComponent.presentWarningToast(`Gamepad not found. Please ensure it is connected.`);
  }

  updateKeyBinding(player: Player, action: string, input: string): void {
    this.userConfigService.updatePlayer('keyBindings', player.id, player.keyBindings);
  }


  async openBindPopover(action: string): Promise<void> {
    const gamepad = this.playerSelected?.gamepad;
    if (gamepad === undefined || gamepad.index === null) return;

    const alert = await this.alertController.create({
      header: 'Waiting for Input',
      message: `Press a button on your ${gamepad.id} for ${action.toUpperCase()}`,
      backdropDismiss: false,
    });

    await alert.present();
    this.waitingForInput = true;

    if (gamepad.index !== -1)
      this.waitForGamepadInput(gamepad.index, action, alert);
    else
      this.waitForKeyboardInput(action, alert)
  }


  waitForGamepadInput(gamepadIndex: number, action: string, alert: HTMLIonAlertElement): void {
    const checkInput = () => {
      const gamepad = navigator.getGamepads()[gamepadIndex];
      if (!gamepad) {
        AppComponent.presentWarningToast(`Gamepad disconnected. Please reconnect to bind the action "${action}".`);
        this.waitingForInput = false;
        alert.dismiss();
        return;
      }

      // Check for button presses
      for (let i = 0; i < gamepad.buttons.length; i++) {
        if (gamepad.buttons[i].pressed) {
          // Bind the action to the pressed button
          this.bindKey(action, `Button ${i}`);
          this.waitingForInput = false;
          alert.dismiss();
          return;
        }
      }
      if (this.waitingForInput)
        requestAnimationFrame(checkInput);
    };
    requestAnimationFrame(checkInput);
  }

  waitForKeyboardInput(action: string, alert: HTMLIonAlertElement) {
    const checkKeyboardInput = (event: KeyboardEvent) => {
      this.bindKey(action, event.key);
      this.waitingForInput = false;
      alert.dismiss();
      window.removeEventListener('keydown', checkKeyboardInput);
    };
    window.addEventListener('keydown', checkKeyboardInput);
  }

  bindKey(action: string, input: string): void {
    if (this.playerSelected) {
      this.playerSelected.keyBindings[action] = input;
      console.log(`Bound "${action}" to "${input}" for Player ${this.playerSelected.name}`);
      this.userConfigService.updatePlayer('keyBindings', this.playerSelected.id, this.playerSelected.keyBindings);
    }
  }
}

