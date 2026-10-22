import { Component, OnInit, inject } from '@angular/core'
import { IonApp, IonRouterOutlet } from '@ionic/angular'

import { AnnouncerService } from './services/gameplay/announcer.service'
import { MusicCacheService } from './services/local-storage/music.cache.service'
import { PresenceService } from './services/thirdpartyapp/presence.service'
import { SoundService } from './services/gameplay/sound.service'
import { ToastController } from '@ionic/angular'
import { productionConsole } from './shared/console-output'

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private toastController = inject(ToastController)
  private presenceService = inject(PresenceService)
  private musicCacheService = inject(MusicCacheService)

  static appInstance: AppComponent

  constructor() {
    const announcerService = inject(AnnouncerService)
    const soundService = inject(SoundService)

    AppComponent.appInstance = this
    announcerService.Init()

    document.addEventListener('click', () => soundService.InitBackgroundMusic(), { once: true })
  }

  ngOnInit() {
    this.musicCacheService.UpdateCache()
    this.presenceService.Init()
  }

  //#region Toasts
  async PresentOkToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 6000,
      color: 'success'
    })
    toast.present()
  }

  async PresentWarningToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 6000,
      color: 'warning'
    })
    toast.present()
  }

  async PresentErrorToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 6000,
      color: 'danger'
    })
    toast.present()
  }
  //#endregion

  //#region Statics
  static PresentOkToast(message: string) {
    productionConsole.log(message)
    AppComponent.appInstance.PresentOkToast(message)
  }

  static PresentWarningToast(message: string) {
    productionConsole.warn(message)
    AppComponent.appInstance.PresentWarningToast(message)
  }

  static PresentErrorToast(message: string) {
    productionConsole.error(message)
    AppComponent.appInstance.PresentErrorToast(message)
  }
  //#endregion
}
