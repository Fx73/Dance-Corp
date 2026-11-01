import { Component, inject } from '@angular/core'
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonIcon, IonInput, IonItem, IonSelect, IonSelectOption } from '@ionic/angular'

import { AnnouncerService } from 'src/app/services/gameplay/announcer.service'

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
    this.userConfigService.UpdatePlayer('gamepadId', playerIndex, gamepadId)
  }

  UpdateUser(playerIndex: number, userId: string | null) {
    this.userConfigService.UpdatePlayer('userId', playerIndex, userId)
  }

  get allPlayersReady(): boolean {
    return this.userConfigService.ArePlayersReady()
  }

  GetPlayerStatus(): string {
    const players = this.userConfigService.players
    const names = players.map((player, index) => player.name ?? `Player ${index + 1}`)
    const missingGamepad = names.filter((_, index) => players[index].gamepadId === undefined)
    // Not blocking: the gamepad plays as soon as the browser sees it
    const unseenGamepad = names.filter((_, index) => players[index].gamepadId !== undefined && !UserConfigService.IsGamepadSeen(players[index]))

    let statusMessage = this.allPlayersReady ? "✅ All players are ready!\n" : ""

    if (missingGamepad.length > 0) {
      statusMessage += `⚠ ${missingGamepad.join(", ")} must have a gamepad.\n`
    }

    if (unseenGamepad.length > 0) {
      statusMessage += `🔄 ${unseenGamepad.join(", ")}: press a button to activate your gamepad.\n`
    }

    return statusMessage
  }

  OnStartClick() {
    this.announcerService.PlayAnnouncer("ready")
  }

}
