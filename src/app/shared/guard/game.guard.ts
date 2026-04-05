import { CanActivateFn, Router } from '@angular/router';

import { UserConfigService } from 'src/app/services/userconfig.service';
import { inject } from '@angular/core';

export const gameGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const userConfig = inject(UserConfigService);

  if (userConfig.isReady) {
    return true;
  }

  router.navigate(['/play/browse']);
  return false;
};
