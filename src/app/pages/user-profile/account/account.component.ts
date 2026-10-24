import { Component, inject } from '@angular/core'

import { FormsModule } from '@angular/forms'
import { IonButton, IonCard, IonInput, IonItem } from '@ionic/angular'
import { AppComponent } from 'src/app/app.component'
import { LoginFireauthService } from 'src/app/services/firestore/login.fireauth.service'

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
  standalone: true,
  imports: [IonButton, IonCard, IonInput, IonItem, FormsModule],
})
export class AccountComponent {
  private loginService = inject(LoginFireauthService)

  name: string = ''
  email: string = ''
  password: string = ''
  password2: string = ''
  isEmailVerified: boolean = false

  constructor() {
    const loginService = this.loginService

    const user = loginService.GetAuthUser()
    this.name = user!.displayName ?? ""
    this.email = user!.email ?? ""
    this.isEmailVerified = user!.emailVerified

  }

  async SaveProfile(): Promise<void> {
    try {
      await this.loginService.UpdateProfile(this.email, this.name)
      AppComponent.PresentOkToast("Profile updated.")
    } catch (error) {
      AppComponent.PresentWarningToast("Profile update failed: " + error)
    }
  }

  async SavePassword(): Promise<void> {
    if (this.password !== this.password2) return
    try {
      await this.loginService.UpdatePassword(this.password)
      AppComponent.PresentOkToast("Password updated.")
    } catch (error) {
      AppComponent.PresentWarningToast("Password update failed: " + error)
    }
  }

  async ResendEmail(): Promise<void> {
    try {
      await this.loginService.ResendEmail()
      AppComponent.PresentOkToast("A verification email has been sent.")
    } catch (error) {
      AppComponent.PresentWarningToast("Sending the verification email failed: " + error)
    }
  }

  async LogOut(): Promise<void> {
    try {
      await this.loginService.LogOut()
    } catch (error) {
      AppComponent.PresentWarningToast("Logout failed: " + error)
    }
  }

}
