import { Component, inject } from '@angular/core'
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonIcon, IonInput, IonItem, IonSelect, IonSelectOption } from '@ionic/angular'

import { AnnouncerService } from 'src/app/services/gameplay/announcer.service'
import { AppComponent } from 'src/app/app.component'

import { FormsModule } from '@angular/forms'
import { GamepadService } from 'src/app/services/gameplay/gamepad.service'
import { HeaderComponent } from "src/app/shared/component/header/header.component"
import { Player } from 'src/app/game/game-model/player'
import { RouterModule } from '@angular/router'
import { UserConfigService } from 'src/app/services/userconfig.service'
import { addCircle } from 'ionicons/icons'
import { addIcons } from 'ionicons'

@Component({
  selector: 'app-player-selection',
  templateUrl: './player-selection.page.html',
  styleUrls: ['./player-selection.page.scss'],
  standalone: true,
  imports: [IonInput, IonIcon, IonCardSubtitle, IonCardHeader, IonButton, IonCardContent, IonItem, IonCard, IonCardTitle, IonContent, IonSelectOption, RouterModule, IonSelect, FormsModule, HeaderComponent]
})
export class PlayerSelectionPage {
  userConfigService = inject(UserConfigService)
  gamepadService = inject(GamepadService)
  private announcerService = inject(AnnouncerService)

  userList: { id: string | null, name: string }[] = []

  constructor() {
    addIcons({ addCircle })
  }

  //TODO handle multiple connections

  GetPlayers(): Player[] {
    return this.userConfigService.players
  }

  AddPlayer(): void {
    this.userConfigService.AddPlayer()
  }

  RemovePlayer(index: number): void {
    this.userConfigService.RemovePlayerAt(index)
  }

  UpdateGamepad(playerIndex: number, gamepadId: string): void {
    if (gamepadId === "Keyboard") {
      this.userConfigService.UpdatePlayer('gamepad', playerIndex, { index: -1, id: "Keyboard" })

    } else {
      const gamepad = navigator.getGamepads().filter(g => g !== null).find(g => g.id === gamepadId)
      if (gamepad)
        this.userConfigService.UpdatePlayer("gamepad", playerIndex, { index: gamepad.index, id: gamepad.id })
      else
        AppComponent.PresentWarningToast(`Gamepad not found. Please ensure it is connected.`)
    }
  }

  UpdateUser(playerIndex: number, userId: string | null) {
    this.userConfigService.UpdatePlayer('userId', playerIndex, userId)
  }

  get allPlayersReady(): boolean {
    return this.userConfigService.players.every(player => player.gamepad?.id && player.gamepad.index !== null)
  }

  GetPlayerStatus(): string {
    const players = this.userConfigService.players

    if (this.allPlayersReady) {
      return "✅ All players are ready!"
    }

    const missingGamepad = players.filter(player => !player.gamepad?.id).map((player, index) => player.name ?? `Player ${index + 1}`)
    const unrecognizedGamepad = players.filter(player => player.gamepad?.id && player.gamepad.index === null).map((player, index) => player.name ?? `Player ${index + 1}`)

    let statusMessage = ""

    if (missingGamepad.length > 0) {
      statusMessage += `⚠ ${missingGamepad.join(", ")} must have a gamepad.\n`
    }

    if (unrecognizedGamepad.length > 0) {
      statusMessage += `🔄 ${unrecognizedGamepad.join(", ")} must press a button to activate their gamepad.\n`
    }

    return statusMessage || "🔍 Waiting for configuration..."
  }

  OnStartClick() {
    this.announcerService.PlayAnnouncer("ready")
  }

}
