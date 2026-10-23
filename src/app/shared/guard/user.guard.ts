import { catchError, filter, firstValueFrom, of, timeout } from 'rxjs'

import { Injectable, inject } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { Router, UrlTree } from '@angular/router'
import { getAuth } from 'firebase/auth'
import { UserFirestoreService } from 'src/app/services/firestore/user.firestore.service'

@Injectable({
    providedIn: 'root'
})
export class UserGuard {
    //#region Constants
    private readonly USER_FETCH_TIMEOUT_MS = 5000
    //#endregion

    private userFirestoreService = inject(UserFirestoreService)
    private router = inject(Router)
    private userData$ = toObservable(this.userFirestoreService.userData)

    async canActivate(): Promise<boolean | UrlTree> {
        if (this.userFirestoreService.user)
            return true

        // Wait for Firebase to restore the persisted session
        const auth = getAuth()
        await auth.authStateReady()
        if (!auth.currentUser)
            return this.router.createUrlTree(['/home'])

        // Wait for the user document to be fetched from Firestore
        const user = await firstValueFrom(this.userData$.pipe(
            filter(u => u !== null),
            timeout({ first: this.USER_FETCH_TIMEOUT_MS }),
            catchError(() => of(null))
        ))
        return user ? true : this.router.createUrlTree(['/home'])
    }
}
