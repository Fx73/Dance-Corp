import { AlertController, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonHeader, IonItem, IonLabel, IonSelect, IonSelectOption, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { Component, NgZone, OnInit } from '@angular/core';

import { AppComponent } from 'src/app/app.component';
import { ArrowDirection } from 'src/app/game/constants/arrow-direction.enum';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GamepadService } from 'src/app/services/gamepad.service';
import { HeaderComponent } from "../../../shared/header/header.component";
import { Player } from 'src/app/game/gameModel/player';
import { UserConfigService } from 'src/app/services/userconfig.service';

@Component({
  selector: 'app-pad-test',
  templateUrl: './pad-test.page.html',
  styleUrls: ['./pad-test.page.scss'],
  standalone: true,
  imports: [IonCardSubtitle, IonItem, IonLabel, IonButton, IonCardContent, IonCardTitle, IonCard, IonCardHeader, IonSelect, IonSelectOption, IonContent, CommonModule, FormsModule, HeaderComponent]
})
export class PadTestPage {
  readonly ArrowDirection = ArrowDirection;
  readonly arrowKeys = Object.values(ArrowDirection).filter(value => typeof value === 'number')
  playerIndexSelected: number | undefined;
  playerSelected: Player | undefined;
  gampadBindings: Map<ArrowDirection, number> = new Map<ArrowDirection, number>();
  keyboardBindings: Map<ArrowDirection, string> = new Map<ArrowDirection, string>();

  waitingForInput: boolean = false;


  constructor(
    public gamepadService: GamepadService,
    public userConfigService: UserConfigService,
    private alertController: AlertController
  ) { }

  ngOnInit(): void {
  }

  selectPlayer(player: Player, playerIndex: number) {
    this.playerIndexSelected = playerIndex
    this.playerSelected = player
    this.gampadBindings.clear();
    this.keyboardBindings.clear();
    // Inverse keyboard bindings (from key to ArrowDirection)
    for (const [key, direction] of player.keyBindingKeyboard.entries()) {
      this.keyboardBindings.set(direction, key); // Map ArrowDirection -> key
    }

    // Inverse gamepad bindings (from button index to ArrowDirection)
    for (const [button, direction] of player.keyBindingGamepad.entries()) {
      this.gampadBindings.set(direction, button); // Map ArrowDirection -> button index
    }
  }

  updateGamepad(playerIndex: number, gamepadId: string): void {
    if (gamepadId === "Keyboard") {
      this.userConfigService.updatePlayer('gamepad', playerIndex, { index: -1, id: "Keyboard" });

    } else {
      const gamepad = navigator.getGamepads().filter(g => g !== null).find(g => g.id === gamepadId)
      if (gamepad)
        this.userConfigService.updatePlayer("gamepad", playerIndex, { index: gamepad.index, id: gamepad.id });
      else
        AppComponent.presentWarningToast(`Gamepad not found. Please ensure it is connected.`);
    }
  }


  async openBindPopover(arrowDirection: ArrowDirection): Promise<void> {
    const gamepad = this.playerSelected?.gamepad;
    if (gamepad === undefined || gamepad.index === null) return;

    const alert = await this.alertController.create({
      header: 'Waiting for Input',
      message: `Press a button on your ${gamepad.id} for ${ArrowDirection[arrowDirection].toUpperCase()}`,
      backdropDismiss: false,
    });

    await alert.present();
    this.waitingForInput = true;

    if (gamepad.index !== -1)
      this.waitForGamepadInput(gamepad.index, arrowDirection, alert);
    else
      this.waitForKeyboardInput(arrowDirection, alert)
  }


  waitForGamepadInput(gamepadIndex: number, arrowDirection: ArrowDirection, alert: HTMLIonAlertElement): void {
    const checkInput = () => {
      const gamepad = navigator.getGamepads()[gamepadIndex];
      if (!gamepad) {
        AppComponent.presentWarningToast(`Gamepad disconnected. Please reconnect.`);
        this.waitingForInput = false;
        alert.dismiss();
        return;
      }

      // Check for button presses
      for (let i = 0; i < gamepad.buttons.length; i++) {
        if (gamepad.buttons[i].pressed) {
          // Bind the action to the pressed button
          this.gampadBindings.set(arrowDirection, i);
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

  waitForKeyboardInput(arrowDirection: ArrowDirection, alert: HTMLIonAlertElement) {
    const checkKeyboardInput = (event: KeyboardEvent) => {
      // Bind the action to the pressed button
      this.keyboardBindings.set(arrowDirection, event.key);
      this.waitingForInput = false;
      alert.dismiss();
      window.removeEventListener('keydown', checkKeyboardInput);
    };
    window.addEventListener('keydown', checkKeyboardInput);
  }

  validateMapping(): void {
    if (this.playerSelected?.gamepad == null)
      return

    if (this.playerSelected.gamepad.index === -1) {
      const keyboardBindingsObject: Map<string, ArrowDirection> = new Map<string, ArrowDirection>();
      for (const [direction, key] of this.keyboardBindings.entries()) {
        keyboardBindingsObject.set(key, direction);
      }
      this.userConfigService.updatePlayer("keyBindingKeyboard", this.playerIndexSelected!, keyboardBindingsObject);
      AppComponent.presentOkToast("Player keyboard mappings have been updated.")

    } else {
      const gamepadBindingsObject: Map<number, ArrowDirection> = new Map<number, ArrowDirection>();
      for (const [direction, button] of this.gampadBindings.entries()) {
        gamepadBindingsObject.set(button, direction);
      }
      this.userConfigService.updatePlayer('keyBindingGamepad', this.playerIndexSelected!, gamepadBindingsObject);
      AppComponent.presentOkToast("Player gamepad mappings have been updated.")
    }

  }

}

