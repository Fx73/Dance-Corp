import { Component, ViewChild } from '@angular/core';
import { IonicModule, PopoverController } from '@ionic/angular';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

import { IonIcon } from '@ionic/angular/standalone';
import { LoginComponent } from './login/login.component';
import { LoginService } from './../../services/login.service';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { User } from 'firebase/auth';
import { addIcons } from 'ionicons';
import { person } from 'ionicons/icons';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
  standalone: true,
  imports: [IonicModule, NgIf],
})
export class UserComponent {
  @ViewChild('userpopover', { static: false }) userpopover!: HTMLIonPopoverElement;

  public static user: User | null = null
  get user(): User | null {
    return UserComponent.user
  }
  set user(value: User | null) {
    UserComponent.user = value
  }

  constructor(private router: Router, private popoverController: PopoverController, private loginService: LoginService) {
    this.user = getAuth().currentUser
    onAuthStateChanged(getAuth(), (_user) => {
      this.user = _user;
    });
    addIcons({
      'person': person
    });
  }


  async presentPopover(e: Event) {
    let popover: HTMLIonPopoverElement;
    if (this.user) {
      popover = this.userpopover
      popover.event = e
    } else {
      popover = await this.popoverController.create({
        component: LoginComponent,
        componentProps: {
          isSmall: true
        },
        event: e,
      });
    }

    await popover.present();
    await popover.onDidDismiss();
  }



  logout() {
    this.loginService.logOut()
    this.popoverController.dismiss().then(() => {
      this.router.navigateByUrl('home')
    }
    );
  }

  static guardWaitForAuth(): Promise<boolean> {
    const timeout = 500;
    let timeoutId: NodeJS.Timeout;

    const promise = new Promise<boolean>((resolve, reject) => {
      const unsubscribeFun = onAuthStateChanged(getAuth(), (_user) => {
        UserComponent.user = _user;
        clearTimeout(timeoutId);
        unsubscribeFun();

        if (_user) {
          resolve(true);
        } else {
          resolve(false);
        }
      });

      timeoutId = setTimeout(() => {
        unsubscribeFun();
        reject(new Error('Timeout occurred'));

      }, timeout);
    });

    return promise;
  }




}


