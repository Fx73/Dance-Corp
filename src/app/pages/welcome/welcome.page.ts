import { Component, NgZone, OnInit } from '@angular/core';
import { IonBadge, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCol, IonContent, IonGrid, IonHeader, IonImg, IonItem, IonLabel, IonRow, IonText, IonTitle, IonToolbar } from '@ionic/angular/standalone';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from "../../shared/header/header.component";
import { LoginComponent } from "../../shared/user/login/login.component";
import { RouterModule } from '@angular/router';
import { UserDto } from '../user-profile/user.dto';
import { UserFirestoreService } from 'src/app/services/firestore/user.firestore.service';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: true,
  imports: [IonCol, IonRow, IonGrid, IonBadge, IonLabel, IonItem, IonCardHeader, IonCardTitle, IonCardContent, IonCard, IonButton, IonContent, CommonModule, FormsModule, HeaderComponent, RouterModule, LoginComponent]
})
export class WelcomePage implements OnInit {
  userData: UserDto | null = null;

  constructor(userService: UserFirestoreService) {
    userService.userData$.subscribe(userData => this.userData = userData)
  }

  ngOnInit() {

  }


  isUserLoggedIn() {
    return this.userData !== null
  }

}
