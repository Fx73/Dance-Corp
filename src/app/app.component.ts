import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

import { Component } from '@angular/core';
import { HeaderComponent } from "./shared/header/header.component";
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  static appInstance: AppComponent;

  static presentOkToast(message: string) {
    AppComponent.appInstance.presentOkToast(message)
  }
  static presentWarningToast(message: string) {
    AppComponent.appInstance.presentWarningToast(message)
  }

  constructor(private toastController: ToastController) {
    AppComponent.appInstance = this;
  }


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
}
