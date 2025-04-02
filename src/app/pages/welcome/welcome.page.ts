import { Component, NgZone, OnInit } from '@angular/core';
import { IonBadge, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonHeader, IonItem, IonLabel, IonText, IonTitle, IonToolbar } from '@ionic/angular/standalone';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from "../../shared/header/header.component";
import { RouterModule } from '@angular/router';
import { UserComponent } from '../../shared/user/user.component';
import { UserDto } from '../user-profile/user.dto';
import { UserFirestoreService } from 'src/app/services/firestore/user.firestore.service';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: true,
  imports: [IonBadge, IonLabel, IonItem, IonCardHeader, IonCardTitle, IonCardContent, IonCardSubtitle, IonCard, IonButton, IonContent, CommonModule, FormsModule, HeaderComponent, RouterModule]
})
export class WelcomePage implements OnInit {
  userData: UserDto | null;

  constructor(userService: UserFirestoreService, private ngZone: NgZone) {
    this.userData = userService.getUserData()
  }

  ngOnInit() {

  }


  isUserLoggedIn() {
    return UserComponent.user !== null
  }

}
