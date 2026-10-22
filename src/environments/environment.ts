// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
// `ng serve` and the `dev` configuration keep this file and target the dev Firebase project.

import type { FirebaseOptions } from 'firebase/app'

export const environment = {
  production: false,
  firebase: {
    apiKey: "AIzaSyDHXdpC_ShZgCdSv7vTVqvRFjiiasdaK3E",
    authDomain: "dance-corp-dev.firebaseapp.com",
    projectId: "dance-corp-dev",
    storageBucket: "dance-corp-dev.firebasestorage.app",
    messagingSenderId: "259749664020",
    appId: "1:259749664020:web:80a9888039fce4620f5e01"
  } as FirebaseOptions
}

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
