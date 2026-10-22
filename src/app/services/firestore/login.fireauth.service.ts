import { Auth, FacebookAuthProvider, GoogleAuthProvider, User, createUserWithEmailAndPassword, getAuth, onAuthStateChanged, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signOut, updateEmail, updatePassword, updateProfile } from 'firebase/auth'

import { AppComponent } from '../../app.component'
import { Injectable } from "@angular/core"

@Injectable({
  providedIn: 'root'
})
export class LoginFireauthService {
  private auth: Auth = getAuth()

  GetAuthUser(): User | null {
    return this.auth.currentUser
  }

  public ListenForUserChanges(callback: (user: User | null) => void): void {
    const auth: Auth = getAuth()
    onAuthStateChanged(auth, (firebaseUser: User | null) => {
      callback(firebaseUser)
    })
  }

  //#region Login
  Register(email: string, password: string): void {
    createUserWithEmailAndPassword(this.auth, email, password)
      .catch((error) => {
        const errorCode = error.code
        const errorMessage = error.message
        AppComponent.PresentWarningToast(errorMessage)
        alert(errorCode)
      })
  }

  Login(email: string, password: string): void {
    signInWithEmailAndPassword(this.auth, email, password)
      .catch((error) => {
        const errorCode = error.code
        const errorMessage = error.message
        AppComponent.PresentWarningToast(errorMessage)
        alert(errorCode)
      })
  }

  LoginWithGoogle() {
    const provider = new GoogleAuthProvider()
    signInWithPopup(this.auth, provider)
      .catch((error) => {
        const errorCode = error.code
        const errorMessage = error.message
        AppComponent.PresentWarningToast(errorMessage)
        alert(errorCode)
      })
  }

  LoginWithFacebook() {
    const provider = new FacebookAuthProvider()
    signInWithPopup(this.auth, provider)
      .catch((error) => {
        const errorCode = error.code
        const errorMessage = error.message
        AppComponent.PresentWarningToast(errorMessage)
        alert(errorCode)
      })
  }

  PasswordRecovery(email: string): void {
    sendPasswordResetEmail(this.auth, email)
      .catch((error) => {
        const errorCode = error.code
        const errorMessage = error.message
        AppComponent.PresentWarningToast(errorMessage)
        alert(errorCode)
      })
  }
  //#endregion

  //#region Account
  ResendEmail(): void {
    if (this.auth.currentUser)
      sendEmailVerification(this.auth.currentUser)
        .catch((error) => {
          const errorCode = error.code
          const errorMessage = error.message
          AppComponent.PresentWarningToast(errorMessage)
          alert(errorCode)
        })
  }

  UpdatePassword(password: string) {
    if (this.auth.currentUser)
      updatePassword(this.auth.currentUser, password).then(() => {
        alert('Password updated')
      }).catch((error) => {
        const errorCode = error.code
        const errorMessage = error.message
        AppComponent.PresentWarningToast(errorMessage)
        alert(errorCode)
      })
  }

  UpdateProfile(email: string, name: string) {
    if (this.auth.currentUser)
      updateEmail(this.auth.currentUser, email).then(() => {
        updateProfile(this.auth.currentUser!, { displayName: name }).then(() => {
          alert('Profile updated')
        }).catch((error) => {
          const errorCode = error.code
          const errorMessage = error.message
          AppComponent.PresentWarningToast(errorMessage)
          alert(errorCode)
        })

      }).catch((error) => {
        const errorCode = error.code
        const errorMessage = error.message
        AppComponent.PresentWarningToast(errorMessage)
        alert(errorCode)
      })
  }
  //#endregion

  LogOut(): void {
    signOut(this.auth)
      .catch((error) => {
        const errorCode = error.code
        const errorMessage = error.message
        AppComponent.PresentWarningToast(errorMessage)
        alert(errorCode)
      })
  }
}
