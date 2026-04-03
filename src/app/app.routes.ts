import { Routes } from '@angular/router';
import { UserGuard } from './shared/guard/user.guard';
import { gameGuard } from './shared/guard/game.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/welcome/welcome.page').then(m => m.WelcomePage)
  },
  {
    path: 'play/game/:musicId',
    loadComponent: () => import('./game/game.page').then(m => m.GamePage),
    canActivate: [gameGuard]
  },
  {
    path: 'browse-upload',
    loadComponent: () => import('./pages/browse-upload/browse-upload.page').then(m => m.BrowseUploadPage),
    canActivate: [UserGuard]
  },
  {
    path: 'upload',
    loadComponent: () => import('./pages/upload/upload.page').then(m => m.UploadPage),
    canActivate: [UserGuard]
  },
  {
    path: 'options',
    loadComponent: () => import('./pages/options/options.page').then(m => m.OptionsPage)
  },
  {
    path: 'options/pad-test',
    loadComponent: () => import('./pages/options/pad-test/pad-test.page').then(m => m.PadTestPage)
  },
  {
    path: 'play/browse',
    loadComponent: () => import('./pages/browse/browse.page').then(m => m.BrowsePage),
  },
  {
    path: 'user-profile',
    loadComponent: () => import('./pages/user-profile/user-profile.page').then(m => m.UserProfilePage),
    canActivate: [UserGuard]
  },
  {
    path: 'play/player-selection',
    loadComponent: () => import('./pages/player-selection/player-selection.page').then(m => m.PlayerSelectionPage)
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.page').then(m => m.AboutPage)
  },
];
