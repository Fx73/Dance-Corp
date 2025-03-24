import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./welcome/welcome.page').then(m => m.WelcomePage)
  },
  {
    path: 'game',
    loadComponent: () => import('./game/game.page').then(m => m.GamePage)
  },
  {
    path: 'upload',
    loadComponent: () => import('./upload/upload.page').then(m => m.UploadPage)
  },
  {
    path: 'options',
    loadComponent: () => import('./options/options.page').then(m => m.OptionsPage)
  },
  {
    path: 'pad-test',
    loadComponent: () => import('./options/pad-test/pad-test.page').then(m => m.PadTestPage)
  },
  {
    path: 'browse',
    loadComponent: () => import('./browse/browse.page').then(m => m.BrowsePage)
  },
];
