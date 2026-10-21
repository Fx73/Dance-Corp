import { getAuth, onAuthStateChanged } from 'firebase/auth'

import { Injectable, inject } from '@angular/core'
import { LoginFireauthService } from 'src/app/services/firestore/login.fireauth.service'
import { Router } from '@angular/router'
import { UserFirestoreService } from 'src/app/services/firestore/user.firestore.service'

@Injectable({
    providedIn: 'root'
})
export class UserGuard {
    private loginFireauthService = inject(LoginFireauthService)
    private userFirestoreService = inject(UserFirestoreService)
    private router = inject(Router)

    async canActivate(): Promise<boolean> {
        if (this.loginFireauthService.GetAuthUser() && this.userFirestoreService.user)
            return true
        try {
            const isLogged = await this.GuardWaitForAuth()
            if (!isLogged) {
                this.router.navigate(['/home'])
                return false
            }

            const isUserFetched = this.GuardWaitForUserDataFetch()
            if (!isUserFetched) {
                this.router.navigate(['/home'])
                return false
            }

            return true
        } catch (error) {
            console.error('Error in Editor Guard:', error)
            return false
        }
    }

    private GuardWaitForAuth(): Promise<boolean> {
        const timeout = 500
        let timeoutId: NodeJS.Timeout

        return new Promise<boolean>((resolve) => {
            const unsubscribeFun = onAuthStateChanged(getAuth(), (_user) => {
                clearTimeout(timeoutId)
                unsubscribeFun()
                resolve(!!_user)
            })

            timeoutId = setTimeout(() => {
                unsubscribeFun()
                resolve(false)
            }, timeout)
        })
    }

    private GuardWaitForUserDataFetch(): Promise<boolean> {
        const timeout = 500
        let timeoutId: NodeJS.Timeout

        return new Promise<boolean>((resolve) => {
            if (this.userFirestoreService.user) {
                clearTimeout(timeoutId)
                resolve(true)
            }

            timeoutId = setTimeout(() => {
                resolve(false)
            }, timeout)
        })
    }

}
