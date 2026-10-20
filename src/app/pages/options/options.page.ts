import { Component, ViewChild, inject } from '@angular/core'
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonInput, IonItem, IonLabel, IonModal, IonRange, IonToggle, InputChangeEventDetail, RangeChangeEventDetail } from '@ionic/angular'

import { AnnouncerService } from 'src/app/services/gameplay/announcer.service'
import { Arrow } from '../../game/game-model/arrows/arrow'
import { ArrowType } from '../../game/constants/arrow-type.enum'

import { FormsModule } from '@angular/forms'
import { GameRound } from '../../game/game-model/gameRound'
import { HeaderComponent } from "src/app/shared/component/header/header.component"
import { MusicCacheService } from '../../services/local-storage/music.cache.service'
import { PlayerDisplayComponent } from '../../game/game-display/player-display.component'
import { RouterModule } from '@angular/router'
import { SoundService } from './../../services/gameplay/sound.service'
import { UserCacheService } from '../../services/local-storage/user.cache.service'
import { UserConfig, UserConfigService } from 'src/app/services/userconfig.service'
import { MusicLocalService } from 'src/app/services/local-storage/local.music.service'

@Component({
  selector: 'app-options',
  templateUrl: './options.page.html',
  styleUrls: ['./options.page.scss'],
  standalone: true,
  imports: [IonRange, IonModal, IonLabel, IonInput, IonToggle, IonCardSubtitle, IonButton, IonItem, IonCardContent, IonCardHeader, IonCardTitle, IonCard, IonModal, IonContent, FormsModule, HeaderComponent, RouterModule, PlayerDisplayComponent]
})
export class OptionsPage {
  private userConfigService = inject(UserConfigService)
  private localMusicService = inject(MusicLocalService)
  private musicCacheService = inject(MusicCacheService)
  private userCacheService = inject(UserCacheService)
  private soundService = inject(SoundService)
  private announcerService = inject(AnnouncerService)

  @ViewChild(PlayerDisplayComponent) playerDisplay?: PlayerDisplayComponent
  showPlayerDisplay = false

  constructor() {
    // Initialize player display if needed
    if (this.userConfigService.getConfig()['showPlayerDisplay']) {
      this.showPlayerDisplay = true
    }
  }

  pinFormatter(value: number) {
    return `${value}`
  }

  pinFormatterVolume(value: number) {
    return (value * 100).toFixed(0) + '%'
  }

  getConfigValue<K extends keyof UserConfig>(key: K): UserConfig[K] {
    return this.userConfigService.getConfig()[key]
  }

  // Raw value from Ionic components: ion-input returns a string (e.g. canvasWidth), kept as is
  updateConfigValue<K extends keyof UserConfig>(key: K, value: UserConfig[K] | InputChangeEventDetail['value'] | RangeChangeEventDetail['value']): void {
    this.userConfigService.updateConfig(key, value as UserConfig[K])
  }

  updatePlayerNumber(value: RangeChangeEventDetail['value']): void {
    this.userConfigService.updatePlayerCount(value as number)
  }

  verifySoundVolume(source: keyof UserConfig): void {
    const volume = this.getConfigValue(source)
    console.log(`Testing volume for ${source} at ${volume}`)
    switch (source) {
      case 'menuMusicVolume':
        this.soundService.refreshMusicVolume()
        break
      case 'announcersVolume':
        this.announcerService.testAnnouncerSound()
        break
      case 'sfxVolume':
        const SOUND_ARROW_UP = new Audio('assets/Sounds/menuFx/arrow_up.ogg')
        SOUND_ARROW_UP.volume = this.getConfigValue('sfxVolume')
        SOUND_ARROW_UP.play()
        break
    }

  }

  verifyDisplay(): void {
    console.log("Updating player display with current config...", this.showPlayerDisplay)
    this.showPlayerDisplay = true
    this.playerDisplay?.update(0)
  }

  getFakeGameRound(): GameRound {
    const arrowMap: Arrow[] = [
      new Arrow(0, 1, ArrowType.Hold, 1.5),
      new Arrow(1, 2, ArrowType.Tap),
      new Arrow(2, 3, ArrowType.Tap),
      new Arrow(3, 4, ArrowType.Mine),
      new Arrow(0, 6, ArrowType.Hold, 8),
      new Arrow(2, 7, ArrowType.Tap),
    ]

    return {
      player: this.userConfigService.players[0],
      dancepad: { lastExposedState: [0, 0, 0, 0] },
      arrowMap: arrowMap,
      currentBeat: 0,
      precisionMessage: [] as Arrow[]
    } as unknown as GameRound
  }

  getModalStyle() {
    const w = this.getConfigValue('canvasWidth')
    const h = this.getConfigValue('canvasHeight')

    return {
      'width': `${w}px`,
      'height': `${h}px`
    }
  }

  resetAll(): void {
    this.userConfigService.resetToDefault()
    location.reload()
  }

  clearMusicCache() {
    this.musicCacheService.clearCache()
    this.userCacheService.clearCache()
  }

  clearMusicEditCache() {
    this.localMusicService.clearAllLocalMusics()

  }
}
