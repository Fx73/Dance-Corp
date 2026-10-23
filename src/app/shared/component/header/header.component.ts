import { Component, Input, inject } from '@angular/core'
import { IonButtons, IonHeader, IonTitle, IonToolbar, PopoverController } from '@ionic/angular'

import { RouterModule } from '@angular/router'
import { UserComponent } from '../../user/user.component'

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [IonButtons, IonHeader, IonTitle, IonToolbar, RouterModule, UserComponent]
})
export class HeaderComponent {
  popoverController = inject(PopoverController)

  @Input()
  title: string = "Welcome"

}
