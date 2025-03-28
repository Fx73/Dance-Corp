import { Component, ViewChild } from '@angular/core';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonInput, IonItem, IonModal, IonRange, IonToggle } from '@ionic/angular/standalone';

import { Arrow } from '../game/gameModel/arrow';
import { ArrowDirection } from '../shared/enumeration/arrow-direction.enum';
import { ArrowType } from '../game/constants/arrow-type.enum';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameRound } from '../game/gameModel/gameRound';
import { HeaderComponent } from "../shared/header/header.component";
import { MusicDto } from '../game/dto/music.dto';
import { PlayerDisplayComponent } from '../game/player-display/player-display.component';
import { RouterModule } from '@angular/router';
import { UserConfigService } from '../services/userconfig.service';

@Component({
  selector: 'app-options',
  templateUrl: './options.page.html',
  styleUrls: ['./options.page.scss'],
  standalone: true,
  imports: [IonRange, IonModal, IonInput, IonToggle, IonCardSubtitle, IonButton, IonItem, IonCardContent, IonCardHeader, IonCardTitle, IonCard, IonModal, IonContent, CommonModule, FormsModule, HeaderComponent, RouterModule, PlayerDisplayComponent]
})
export class OptionsPage {
  @ViewChild(PlayerDisplayComponent) playerDisplay?: PlayerDisplayComponent;
  showPlayerDisplay = false;

  constructor(private userConfigService: UserConfigService) {
  }

  pinFormatter(value: number) {
    return `${value}`;
  }

  getConfigValue<T>(key: any): T {
    return this.userConfigService.getConfig()[key] as T;
  }

  updateConfigValue<T>(key: any, value: T): void {
    this.userConfigService.updateConfig(key, value);
  }

  updatePlayerNumber(value: any): void {
    this.userConfigService.updatePlayerCount(value);
  }

  verifyDisplay(): void {
    this.showPlayerDisplay = true;
    this.playerDisplay?.Update()
  }
  getFakeGameRound(): GameRound {
    const arrowMap: Arrow[] = [
      new Arrow(0, 1, ArrowType.Tap),
      new Arrow(1, 2, ArrowType.Tap),
      new Arrow(2, 3, ArrowType.Hold, 5),
      new Arrow(3, 4, ArrowType.Tap),
      new Arrow(0, 6, ArrowType.Hold, 8),
      new Arrow(2, 7, ArrowType.Tap),
    ];

    return {
      player: this.userConfigService.players[0],
      dancepad: { lastExposedState: [0, 0, 0, 0] },
      arrowMap: arrowMap,
      currentBeat: 0
    } as unknown as GameRound;
  }

  resetAll(): void {
    this.userConfigService.resetToDefault();
    location.reload();
  }


}
