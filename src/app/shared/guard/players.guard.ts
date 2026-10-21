import { CanActivateFn, Router } from '@angular/router'

import { UserConfigService } from 'src/app/services/userconfig.service'
import { inject } from '@angular/core'

export const playersGuard: CanActivateFn = () => {
  const router = inject(Router)
  const userConfig = inject(UserConfigService)

  if (userConfig.ArePlayersReady()) {
    return true
  }

  return router.createUrlTree(['/play/player-selection'])
}
