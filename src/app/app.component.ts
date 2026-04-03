import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { NavigationEnd, Router } from '@angular/router';

import { MusicCacheService } from './services/localStorage/music.cache.service';
import { PresenceService } from './services/thirdpartyapp/presence.service';
import { SoundManager } from './shared/utils/sound.manager';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  static appInstance: AppComponent;

  constructor(private toastController: ToastController, private presenceService: PresenceService, private musicCacheService: MusicCacheService, private router: Router) {
    AppComponent.appInstance = this;
    SoundManager.InitBackgroundMusic();
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.handleRouteChange(event.urlAfterRedirects);
      }
    });
  }

  ngOnInit() {
    this.musicCacheService.updateCache()
    this.presenceService.init()
  }

  private handleRouteChange(url: string) {
    console.log("Route changed to:", url);
    const shouldMute =
      url.startsWith('/play/browse') ||
      url.startsWith('/play/game');

    if (shouldMute) {
      SoundManager.PauseBackgroundMusic();
    } else {
      SoundManager.StartBackgroundMusic();
    }
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
