import { Component, ViewChild, signal, inject } from '@angular/core'
import { IonButton, IonContent, IonIcon, IonItem, IonLabel, IonPopover, PopoverController } from '@ionic/angular'
import { logoGoogle, person } from 'ionicons/icons'

import { AppComponent } from 'src/app/app.component'
import { LoginComponent } from './login/login.component'
import { LoginFireauthService } from 'src/app/services/firestore/login.fireauth.service'
import { Router } from '@angular/router'
import { User } from 'firebase/auth'
import { addIcons } from 'ionicons'

export const currentUser = signal<User | null>(null)

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
  standalone: true,
  imports: [IonButton, IonContent, IonIcon, IonItem, IonLabel, IonPopover],
})
export class UserComponent {
  private router = inject(Router)
  private popoverController = inject(PopoverController)
  private loginService = inject(LoginFireauthService)

  @ViewChild('userpopover', { static: false }) userpopover!: HTMLIonPopoverElement

  user = currentUser

  constructor() {
    const loginService = this.loginService

    loginService.ListenForUserChanges(user => currentUser.set(user))
    addIcons({
      'person': person,
      'logoGoogle': logoGoogle
    })
  }

  async PresentPopover(e: Event) {
    let popover: HTMLIonPopoverElement
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
      })
    }

    await popover.present()
    await popover.onDidDismiss()
  }

  async Logout(): Promise<void> {
    try {
      await this.loginService.LogOut()
    } catch (error) {
      AppComponent.PresentWarningToast("Logout failed: " + error)
      return
    }
    await this.popoverController.dismiss()
    void this.router.navigateByUrl('home')
  }

}
