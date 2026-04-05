import { Component, NgZone, OnInit, signal } from '@angular/core';
import { IonBadge, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCol, IonContent, IonGrid, IonHeader, IonImg, IonItem, IonLabel, IonRow, IonText, IonTitle, IonToolbar } from '@ionic/angular/standalone';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from "src/app/shared/component/header/header.component";
import { LoginComponent } from "../../shared/user/login/login.component";
import { PresenceService } from '../../services/thirdpartyapp/presence.service';
import { RouterModule } from '@angular/router';
import { UserCacheService } from '../../services/localstorage/user.cache.service';
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
  user = this.userService.userData;

  constructor(private userService: UserFirestoreService, private userCacheService: UserCacheService, private discordRpcService: PresenceService) {
  }

  ngOnInit() {
    this.discordRpcService.update("Let's dance")
  }

}
