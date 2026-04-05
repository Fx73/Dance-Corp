import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

import { AnnouncerService } from './services/gameplay/announcer.service';
import { MusicCacheService } from './services/local-storage/music.cache.service';
import { PresenceService } from './services/thirdpartyapp/presence.service';
import { SoundManager } from './services/gameplay/sound.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  static appInstance: AppComponent;

  constructor(announcerService: AnnouncerService, soundManager: SoundManager, private toastController: ToastController, private presenceService: PresenceService, private musicCacheService: MusicCacheService) {
    AppComponent.appInstance = this;
    announcerService.init();

    document.addEventListener('click', () => soundManager.InitBackgroundMusic(), { once: true });
  }

  ngOnInit() {
    this.musicCacheService.updateCache()
    this.presenceService.init()
  }



  //#region Toasts
  async presentOkToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 6000,
      color: 'success'
    });
    toast.present();
  }

  async presentWarningToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 6000,
      color: 'warning'
    });
    toast.present();
  }

  async presentErrorToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 6000,
      color: 'danger'
    });
    toast.present();
  }

  static presentOkToast(message: string) {
    console.log(message)
    AppComponent.appInstance.presentOkToast(message)
  }
  static presentWarningToast(message: string) {
    console.warn(message)
    AppComponent.appInstance.presentWarningToast(message)
  }
  static presentErrorToast(message: string) {
    console.error(message)
    AppComponent.appInstance.presentErrorToast(message)
  }
  //#endregion
}
