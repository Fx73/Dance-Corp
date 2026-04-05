import { Component, ViewChild } from '@angular/core';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonInput, IonItem, IonLabel, IonModal, IonRange, IonToggle } from '@ionic/angular/standalone';

import { AnnouncerService } from 'src/app/services/gameplay/announcer.service';
import { Arrow } from '../../game/game-model/arrows/arrow';
import { ArrowType } from '../../game/constants/arrow-type.enum';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameRound } from '../../game/game-model/gameRound';
import { HeaderComponent } from "src/app/shared/component/header/header.component";
import { MusicCacheService } from '../../services/local-storage/music.cache.service';
import { PlayerDisplayComponent } from '../../game/game-display/player-display.component';
import { RouterModule } from '@angular/router';
import { SoundManager } from './../../services/gameplay/sound.service';
import { UserCacheService } from '../../services/local-storage/user.cache.service';
import { UserConfigService } from 'src/app/services/userconfig.service';
import { musicLocalService } from 'src/app/services/local-storage/local.music.service';

@Component({
  selector: 'app-options',
  templateUrl: './options.page.html',
  styleUrls: ['./options.page.scss'],
  standalone: true,
  imports: [IonRange, IonModal, IonLabel, IonInput, IonToggle, IonCardSubtitle, IonButton, IonItem, IonCardContent, IonCardHeader, IonCardTitle, IonCard, IonModal, IonContent, CommonModule, FormsModule, HeaderComponent, RouterModule, PlayerDisplayComponent]
})
export class OptionsPage {
  @ViewChild(PlayerDisplayComponent) playerDisplay?: PlayerDisplayComponent;
  showPlayerDisplay = false;

  constructor(private userConfigService: UserConfigService, private localMusicService: musicLocalService, private musicCacheService: MusicCacheService, private userCacheService: UserCacheService, private soundManager: SoundManager, private announcerService: AnnouncerService) {
    // Initialize player display if needed
    if (this.userConfigService.getConfig()['showPlayerDisplay']) {
      this.showPlayerDisplay = true;
    }
  }

  pinFormatter(value: number) {
    return `${value}`;
  }
  pinFormatterVolume(value: number) {
    return (value * 100).toFixed(0) + '%';
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


  verifySoundVolume(source: string): void {
    const volume = this.getConfigValue<number>(source);
    console.log(`Testing volume for ${source} at ${volume}`);
    switch (source) {
      case 'menuMusicVolume':
        this.soundManager.refreshMusicVolume();
        break;
      case 'announcersVolume':
        this.announcerService.testAnnouncerSound();
        break;
      case 'sfxVolume':
        const SOUND_ARROW_UP = new Audio('assets/Sounds/menuFx/arrow_up.ogg');
        SOUND_ARROW_UP.volume = volume;
        SOUND_ARROW_UP.play();
        break;
    }

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
    this.userCacheService.clearCache();
  }
  clearMusicEditCache() {
    this.localMusicService.clearAllLocalMusics()

  }
}
