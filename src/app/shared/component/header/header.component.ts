import { Component, Input } from '@angular/core';
import { IonButtons, IonHeader, IonImg, IonTitle, IonToolbar, PopoverController } from '@ionic/angular';

import { RouterModule } from '@angular/router';
import { UserComponent } from '../../user/user.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [IonButtons, IonHeader, IonImg, IonTitle, IonToolbar, RouterModule, UserComponent]
})
export class HeaderComponent {

  @Input()
  title: string = "Welcome";

  constructor(public popoverController: PopoverController) { }




}

