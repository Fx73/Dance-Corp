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

  selectPlayer(player: Player) {
    this.playerSelected = player
    this.gampadBindings.clear();
    for (const k of player.keyBindings) {
      this.gampadBindings.set(k[0], k[1])
    }
    this.keyboardBindings.clear();
    for (const [key, buttonIndex] of Object.entries(player.keyboardBindings)) {
      const arrowDirection = player.keyBindings.find(([, index]) => index === buttonIndex)?.[0]
      if (arrowDirection)
        this.keyboardBindings.set(arrowDirection, key)
      else
        console.error("Binding failed on btn " + buttonIndex)
    }
  }

  updateGamepad(playerIndex: number, gamepadId: string): void {
    if (gamepadId === "Keyboard") {
      this.userConfigService.assignKeyboardToPlayer(playerIndex)
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
      message: `Press a button on your ${gamepad.id} for ${arrowDirection.toUpperCase()}`,
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
      const keyboardBindingsObject: { [btnLinked: string]: number } = {};
      this.keyboardBindings.forEach((key, arrowDirection) => {
        const buttonIndex = this.gampadBindings.get(arrowDirection);
        if (buttonIndex !== undefined) {
          keyboardBindingsObject[key] = buttonIndex;
        } else {
          console.error(`No button index found for ArrowDirection "${arrowDirection}"`);
        }
      });
      console.log(keyboardBindingsObject)
      this.userConfigService.updatePlayer('keyboardBindings', this.playerSelected.id, keyboardBindingsObject);
      AppComponent.presentOkToast("Player keyboard mappings have been updated.")

    } else {
      const gamepadBindingsObject: { [ArrowDirection: string]: number } = {};
      this.gampadBindings.forEach((value, key) => {
        gamepadBindingsObject[key] = value;
      });
      console.log(gamepadBindingsObject)
      this.userConfigService.updatePlayer('keyBindings', this.playerSelected.id, gamepadBindingsObject);
      AppComponent.presentOkToast("Player gamepad mappings have been updated.")
    }

  }

}

