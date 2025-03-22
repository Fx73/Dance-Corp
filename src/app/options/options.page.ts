import { Component, OnInit } from '@angular/core';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonHeader, IonItem, IonLabel, IonRange, IonTitle, IonToggle, IonToolbar } from '@ionic/angular/standalone';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from "../shared/header/header.component";
import { RouterModule } from '@angular/router';
import { UserConfigService } from '../services/userconfig.service';

@Component({
  selector: 'app-options',
  templateUrl: './options.page.html',
  styleUrls: ['./options.page.scss'],
  standalone: true,
  imports: [IonToggle, IonCardSubtitle, IonButton, IonItem, IonCardContent, IonCardHeader, IonCardTitle, IonCard, IonRange, IonContent, CommonModule, FormsModule, HeaderComponent, RouterModule]
})
export class OptionsPage {


  constructor(private userConfigService: UserConfigService) {
  }

  pinFormatter(value: number) {
    return `${value}`;
  }

  getConfigValue<T>(key: any): T {
    return this.userConfigService.getConfig()[key] as T;
  }

  updateConfigValue<T>(key: any, value: T): void {
    this.userConfigService.updateConfig(key, value);
  }

  updatePlayerNumber(value: any): void {
    this.userConfigService.updatePlayerCount(value);
  }

  resetAll(): void {
    this.userConfigService.resetToDefault();
    location.reload();
  }
}
