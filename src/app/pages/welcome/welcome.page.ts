import { Component, OnInit, Signal } from '@angular/core';
import { IonBadge, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCol, IonContent, IonGrid, IonItem, IonLabel, IonRow } from '@ionic/angular/standalone';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from "src/app/shared/component/header/header.component";
import { LoginComponent } from "../../shared/user/login/login.component";
import { PresenceService } from '../../services/thirdpartyapp/presence.service';
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
  user: Signal<UserDto | null>;

  constructor(userService: UserFirestoreService, private discordRpcService: PresenceService) {
    this.user = userService.userData;
  }

  ngOnInit() {
    this.discordRpcService.update("Let's dance")
  }

}
