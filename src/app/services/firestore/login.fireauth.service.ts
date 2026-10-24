import { Auth, FacebookAuthProvider, GoogleAuthProvider, User, createUserWithEmailAndPassword, getAuth, onAuthStateChanged, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signOut, updateEmail, updatePassword, updateProfile } from 'firebase/auth'

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
  async Register(email: string, password: string): Promise<void> {
    await createUserWithEmailAndPassword(this.auth, email, password)
  }

  async Login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password)
  }

  async LoginWithGoogle(): Promise<void> {
    await signInWithPopup(this.auth, new GoogleAuthProvider())
  }

  async LoginWithFacebook(): Promise<void> {
    await signInWithPopup(this.auth, new FacebookAuthProvider())
  }

  async PasswordRecovery(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email)
  }
  //#endregion

  //#region Account
  async ResendEmail(): Promise<void> {
    if (!this.auth.currentUser) throw new Error("User not authenticated")
    await sendEmailVerification(this.auth.currentUser)
  }

  async UpdatePassword(password: string): Promise<void> {
    if (!this.auth.currentUser) throw new Error("User not authenticated")
    await updatePassword(this.auth.currentUser, password)
  }

  async UpdateProfile(email: string, name: string): Promise<void> {
    if (!this.auth.currentUser) throw new Error("User not authenticated")
    await updateEmail(this.auth.currentUser, email)
    await updateProfile(this.auth.currentUser, { displayName: name })
  }
  //#endregion

  async LogOut(): Promise<void> {
    await signOut(this.auth)
  }
}
