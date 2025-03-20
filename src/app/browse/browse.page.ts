import { Component, OnInit } from '@angular/core';
import { InfiniteScrollCustomEvent, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonHeader, IonImg, IonInfiniteScroll, IonInfiniteScrollContent, IonItem, IonLabel, IonSearchbar, IonText, IonTitle, IonToolbar } from '@ionic/angular/standalone';

import { CommonModule } from '@angular/common';
import { FireStoreService } from '../services/firestore.service';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from "../shared/header/header.component";
import { MusicDto } from '../game/dto/music.dto';
import { Router } from '@angular/router';

@Component({
  selector: 'app-browse',
  templateUrl: './browse.page.html',
  styleUrls: ['./browse.page.scss'],
  standalone: true,
  imports: [IonCardSubtitle, IonLabel, IonText, IonCardContent, IonCardTitle, IonInfiniteScrollContent, IonImg, IonItem, IonInfiniteScroll, IonSearchbar, IonCard, IonCardHeader, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, HeaderComponent]
})
export class BrowsePage implements OnInit {

  musics: MusicDto[] = [];
  searchQuery: string = '';


  constructor(private router: Router, private fireStoreService: FireStoreService) { }

  ngOnInit() {
    this.fireStoreService.GetAllMusics(null).then(value => this.musics = value);
  }

  loadMusic(dto: MusicDto) {

  }

  onSearch(event: any) {
    this.searchQuery = event.target.value.toLowerCase();
    this.fireStoreService.GetAllMusicsWithSearch(null, this.searchQuery).then(value => this.musics = value);
  }

  onIonInfinite(event: InfiniteScrollCustomEvent) {
    const lastMusic: MusicDto = this.musics.at(-1)!
    if (this.searchQuery === '')
      this.fireStoreService.GetAllMusics(lastMusic?.id ?? null).then(value => this.musics = this.musics.concat(value)).catch((e) => { console.log(e.message); event.target.complete() });
    else
      this.fireStoreService.GetAllMusicsWithSearch(lastMusic?.id ?? null, this.searchQuery).then(value => this.musics = this.musics.concat(value)).catch((e) => { console.log(e.message); event.target.complete() });
  }

}
