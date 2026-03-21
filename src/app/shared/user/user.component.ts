import { Component, ViewChild, signal } from '@angular/core';
import { IonicModule, PopoverController } from '@ionic/angular';
import { logoGoogle, person } from 'ionicons/icons';

import { LoginComponent } from './login/login.component';
import { LoginFireauthService } from 'src/app/services/firestore/login.fireauth.service';
import { Router } from '@angular/router';
import { User } from 'firebase/auth';
import { addIcons } from 'ionicons';

export const currentUser = signal<User | null>(null);

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
  standalone: true,
  imports: [IonicModule],
})
export class UserComponent {
  @ViewChild('userpopover', { static: false }) userpopover!: HTMLIonPopoverElement;

  user = currentUser;

  constructor(private router: Router, private popoverController: PopoverController, private loginService: LoginFireauthService) {
    loginService.listenForUserChanges(user => currentUser.set(user))
    addIcons({
      'person': person,
      'logoGoogle': logoGoogle
    });
  }


  async presentPopover(e: Event) {
    let popover: HTMLIonPopoverElement;
    if (this.user()) {
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


}


