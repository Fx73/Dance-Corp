import { Component, OnInit } from '@angular/core';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList, IonSelect, IonSelectOption, IonTitle, IonToolbar } from '@ionic/angular/standalone';

import { AppComponent } from 'src/app/app.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GamepadService } from 'src/app/services/gamepad.service';
import { HeaderComponent } from "src/app/shared/component/header/header.component";
import { Player } from 'src/app/game/gameModel/player';
import { RouterModule } from '@angular/router';
import { UserConfigService } from 'src/app/services/userconfig.service';
import { addCircle } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-player-selection',
  templateUrl: './player-selection.page.html',
  styleUrls: ['./player-selection.page.scss'],
  standalone: true,
  imports: [IonInput, IonIcon, IonCardSubtitle, IonCardHeader, IonButton, IonCardContent, IonItem, IonCard, IonCardTitle, IonContent, IonSelectOption, RouterModule, IonSelect, CommonModule, FormsModule, HeaderComponent]
})
export class PlayerSelectionPage implements OnInit {

  userList: { id: string | null, name: string }[] = []

  constructor(public userConfigService: UserConfigService, public gamepadService: GamepadService) {
    addIcons({ addCircle });
  }

  ngOnInit() {
    //TODO handle mutliple connexion
  }


  getPlayers(): Player[] {
    return this.userConfigService.players
  }

  addPlayer(): void {
    this.userConfigService.addPlayer();
  }

  removePlayer(index: number): void {
    this.userConfigService.removePlayerAt(index);
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

  updateUser(playerIndex: number, userId: string | null) {
    this.userConfigService.updatePlayer('userId', playerIndex, userId);
  }

  get allPlayersReady(): boolean {
    return this.userConfigService.players.every(player => player.gamepad?.id && player.gamepad.index !== null);
  }

  GetPlayerStatus(): string {
    const players = this.userConfigService.players;

    if (this.allPlayersReady) {
      return "✅ All players are ready!";
    }

    const missingGamepad = players.filter(player => !player.gamepad?.id).map((player, index) => player.name ?? `Player ${index + 1}`);
    const unrecognizedGamepad = players.filter(player => player.gamepad?.id && player.gamepad.index === null).map((player, index) => player.name ?? `Player ${index + 1}`);

    let statusMessage = "";

    if (missingGamepad.length > 0) {
      statusMessage += `⚠ ${missingGamepad.join(", ")} must have a gamepad.\n`;
    }

    if (unrecognizedGamepad.length > 0) {
      statusMessage += `🔄 ${unrecognizedGamepad.join(", ")} must press a button to activate their gamepad.\n`;
    }

    return statusMessage || "🔍 Waiting for configuration...";
  }


}
