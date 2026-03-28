import { Component, OnInit } from '@angular/core';
import { IonBadge, IonCard, IonCardContent, IonContent, IonIcon } from '@ionic/angular/standalone';
import { logoAngular, logoCss3, logoHtml5, logoIonic, logoSoundcloud, logoYoutube } from 'ionicons/icons';

import { AppConfig } from 'src/app.config';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from "src/app/shared/component/header/header.component";
import { addIcons } from 'ionicons';
import isTauri from 'src/app/shared/utils/tauri';

@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
  standalone: true,
  imports: [IonBadge, IonIcon, IonCardContent, IonCard, IonContent, CommonModule, FormsModule, HeaderComponent]
})
export class AboutPage implements OnInit {
  isDesktop = isTauri;

  readonly version = AppConfig.version;


  constructor() {
    addIcons({ logoYoutube, logoSoundcloud, logoHtml5, logoCss3, logoAngular, logoIonic, 'logo-html5': logoHtml5, 'logo-css3': logoCss3 });

  }

  ngOnInit() {
  }

}
