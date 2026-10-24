import { Component, Input, inject } from '@angular/core'
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonIcon, IonInput, IonItem, IonLabel, IonTab, IonTabBar, IonTabButton, IonTabs, IonTitle } from "@ionic/angular"
import { NgClass } from '@angular/common'
import { keyOutline, logInOutline, logoGoogle, personAddOutline, refreshCircleOutline } from 'ionicons/icons'

import { AppComponent } from 'src/app/app.component'
import { LoginFireauthService } from 'src/app/services/firestore/login.fireauth.service'
import { addIcons } from 'ionicons'

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [IonButton, IonItem, FormsModule, IonCardSubtitle, ReactiveFormsModule, IonTabButton, IonTabBar, IonCardHeader, IonCardTitle, IonCardContent, IonTitle, IonCard, IonTab, IonIcon, IonTabs, NgClass, IonLabel, IonInput],
})
export class LoginComponent {
  private fb = inject(FormBuilder)
  private loginService = inject(LoginFireauthService)

  @Input()
  isSmall = false

  registerForm: FormGroup
  loginForm: FormGroup
  passwordRecoveryForm: FormGroup

  constructor() {
    addIcons({ keyOutline, logInOutline, personAddOutline, refreshCircleOutline, logoGoogle })

    this.registerForm = this.fb.group({
      email: ['', Validators.compose([Validators.required, Validators.email])],
      password: ['', Validators.compose([Validators.required, Validators.minLength(8)])],
    })
    this.loginForm = this.fb.group({
      email: ['', Validators.compose([Validators.required, Validators.email])],
      password: ['', Validators.compose([Validators.required, Validators.minLength(8)])],
    })
    this.passwordRecoveryForm = this.fb.group({
      email: ['', Validators.compose([Validators.required, Validators.email])],
    })
  }

  async Register(email: string, password: string): Promise<void> {
    try {
      await this.loginService.Register(email, password)
    } catch (error) {
      AppComponent.PresentWarningToast("Registration failed: " + error)
    }
  }

  async Login(email: string, password: string): Promise<void> {
    try {
      await this.loginService.Login(email, password)
    } catch (error) {
      AppComponent.PresentWarningToast("Login failed: " + error)
    }
  }

  async LoginWithGoogle(): Promise<void> {
    try {
      await this.loginService.LoginWithGoogle()
    } catch (error) {
      AppComponent.PresentWarningToast("Login failed: " + error)
    }
  }

  async LoginWithFacebook(): Promise<void> {
    try {
      await this.loginService.LoginWithFacebook()
    } catch (error) {
      AppComponent.PresentWarningToast("Login failed: " + error)
    }
  }

  async PasswordRecovery(email: string): Promise<void> {
    try {
      await this.loginService.PasswordRecovery(email)
      AppComponent.PresentOkToast("A password reset email has been sent.")
    } catch (error) {
      AppComponent.PresentWarningToast("Password recovery failed: " + error)
    }
  }

}
