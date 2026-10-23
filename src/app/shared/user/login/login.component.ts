import { Component, Input, inject } from '@angular/core'
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonIcon, IonInput, IonItem, IonLabel, IonTab, IonTabBar, IonTabButton, IonTabs, IonTitle } from "@ionic/angular"
import { NgClass } from '@angular/common'
import { keyOutline, logInOutline, logoGoogle, personAddOutline, refreshCircleOutline } from 'ionicons/icons'

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

  Register(email: string, password: string): void {
    this.loginService.Register(email, password)
  }

  Login(email: string, password: string): void {
    this.loginService.Login(email, password)
  }

  LoginWithGoogle() {
    this.loginService.LoginWithGoogle()
  }

  LoginWithFacebook() {
    this.loginService.LoginWithFacebook()
  }

  PasswordRecovery(email: string): void {
    this.PasswordRecovery(email)
  }

}
