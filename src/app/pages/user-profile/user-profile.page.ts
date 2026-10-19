import { Component, inject } from '@angular/core';
import { IonBadge, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonImg, IonItem, IonLabel, IonText } from '@ionic/angular';

import { AccountComponent } from "./account/account.component";

import { FormsModule } from '@angular/forms';
import { User } from 'firebase/auth';
import { LoginFireauthService } from 'src/app/services/firestore/login.fireauth.service';
import { UserFirestoreService } from 'src/app/services/firestore/user.firestore.service';
import { HeaderComponent } from "src/app/shared/component/header/header.component";
import { UserDto } from './user.dto';

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
