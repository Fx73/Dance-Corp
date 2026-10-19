import { Component, inject } from '@angular/core';
import { IonAvatar, IonBadge, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonImg, IonItem, IonLabel, IonText, IonTitle, IonToolbar } from '@ionic/angular';

import { AccountComponent } from "./account/account.component";

import { FormsModule } from '@angular/forms';
import { HeaderComponent } from "src/app/shared/component/header/header.component";
import { LoginFireauthService } from 'src/app/services/firestore/login.fireauth.service';
import { User } from 'firebase/auth';
import { UserDto } from './user.dto';
import { UserFirestoreService } from 'src/app/services/firestore/user.firestore.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.page.html',
  styleUrls: ['./user-profile.page.scss'],
  standalone: true,
  imports: [IonLabel, IonImg, IonCardContent, IonCardTitle, IonCardHeader, IonItem, IonBadge, IonCard, IonText, IonContent, FormsModule, AccountComponent, HeaderComponent]
})
export class UserProfilePage {
  userAuth: User;
  userData: UserDto;

  constructor() {
    const authService = inject(LoginFireauthService);
    const userService = inject(UserFirestoreService);

    this.userAuth = authService.getAuthUser()!
    this.userData = userService.user!
  }

}
