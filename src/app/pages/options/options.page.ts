import { Component, ViewChild } from '@angular/core';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonInput, IonItem, IonModal, IonRange, IonToggle } from '@ionic/angular/standalone';

import { Arrow } from '../../game/gameModel/arrowManagement/arrow';
import { ArrowType } from '../../game/constants/arrow-type.enum';
import { BrowseUploadPage } from '../browse-upload/browse-upload.page';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameRound } from '../../game/gameModel/gameRound';
import { HeaderComponent } from "src/app/shared/component/header/header.component";
import { LocalMusicService } from 'src/app/services/localStorage/local.music.service';
import { MusicCacheService } from '../../services/localStorage/music.cache.service';
import { PlayerDisplayComponent } from '../../game/gameDisplay/player-display.component';
import { RouterModule } from '@angular/router';
import { UserConfigService } from 'src/app/services/userconfig.service';

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

  constructor(private userConfigService: UserConfigService, private localMusicService: LocalMusicService, private musicCacheService: MusicCacheService) {
    // Initialize player display if needed
    if (this.userConfigService.getConfig()['showPlayerDisplay']) {
      this.showPlayerDisplay = true;
    }
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
    console.log("Updating player display with current config...", this.showPlayerDisplay);
    this.showPlayerDisplay = true;
    this.playerDisplay?.Update(0)
  }
  getFakeGameRound(): GameRound {
    const arrowMap: Arrow[] = [
      new Arrow(0, 1, ArrowType.Hold, 1.5),
      new Arrow(1, 2, ArrowType.Tap),
      new Arrow(2, 3, ArrowType.Tap),
      new Arrow(3, 4, ArrowType.Mine),
      new Arrow(0, 6, ArrowType.Hold, 8),
      new Arrow(2, 7, ArrowType.Tap),
    ];

    return {
      player: this.userConfigService.players[0],
      dancepad: { lastExposedState: [0, 0, 0, 0] },
      arrowMap: arrowMap,
      currentBeat: 0,
      precisionMessage: [] as Arrow[]
    } as unknown as GameRound;
  }
  getModalStyle() {
    const w = this.getConfigValue('canvasWidth');
    const h = this.getConfigValue('canvasHeight');

    return {
      'width': `${w}px`,
      'height': `${h}px`
    };
  }



  resetAll(): void {
    this.userConfigService.resetToDefault();
    location.reload();
  }
  clearMusicCache() {
    this.musicCacheService.clearCache();
  }
  clearMusicEditCache() {
    this.localMusicService.clearAllLocalMusics()

  }
}
