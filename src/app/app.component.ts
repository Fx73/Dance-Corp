import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

import { DiscordSDK } from '@discord/embedded-app-sdk';
import { DiscordService } from './services/discord.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  static appInstance: AppComponent;
  static discordSdk: DiscordSDK;

  constructor(private toastController: ToastController, private discordService: DiscordService) {
    AppComponent.appInstance = this;
  }

  ngOnInit() {
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

  static presentOkToast(message: string) {
    console.log(message)
    AppComponent.appInstance.presentOkToast(message)
  }
  static presentWarningToast(message: string) {
    console.warn(message)
    AppComponent.appInstance.presentWarningToast(message)
  }
  //#endregion
}
