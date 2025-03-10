import { Component, NgZone, OnInit } from '@angular/core';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from "../shared/header/header.component";
import { RouterModule } from '@angular/router';
import { UserComponent } from '../shared/user/user.component';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: true,
  imports: [IonCardHeader, IonCardTitle, IonCardContent, IonCardSubtitle, IonCard, IonButton, IonContent, CommonModule, FormsModule, HeaderComponent, RouterModule]
})
export class WelcomePage implements OnInit {

  constructor(private ngZone: NgZone) { }

  ngOnInit() {

  }


  isUserLoggedIn() {
    return UserComponent.user !== null
  }

}
