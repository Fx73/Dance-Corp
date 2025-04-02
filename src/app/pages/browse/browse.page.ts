import { Component, OnInit } from '@angular/core';
import { InfiniteScrollCustomEvent, IonBadge, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonHeader, IonImg, IonInfiniteScroll, IonInfiniteScrollContent, IonItem, IonLabel, IonSearchbar, IonText, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { MusicDto, NotesDto } from 'src/app/game/gameModel/music.dto';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from "src/app/shared/header/header.component";
import { MusicFirestoreService } from 'src/app/services/firestore/music.firestore.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-browse',
  templateUrl: './browse.page.html',
  styleUrls: ['./browse.page.scss'],
  standalone: true,
  imports: [IonBadge, IonButton, IonCardSubtitle, IonLabel, IonText, IonCardContent, IonCardTitle, IonInfiniteScrollContent, IonImg, IonItem, IonInfiniteScroll, IonSearchbar, IonCard, IonCardHeader, IonContent, CommonModule, FormsModule, HeaderComponent]
})
export class BrowsePage implements OnInit {

  musics: MusicDto[] = [];
  notes: NotesDto[] | undefined;
  selectedMusic: MusicDto | null = null;
  searchQuery: string = '';


  constructor(private router: Router, private fireStoreService: MusicFirestoreService) { }

  ngOnInit() {
    this.fireStoreService.GetAllMusics(null).then(value => this.musics = value);
  }

  runGame(note: NotesDto): void {
    if (!this.selectedMusic)
      return

    this.selectedMusic.notes = [note]
    this.router.navigate(['/game'], {
      state: {
        music: this.selectedMusic,
      }
    });
  }


  showLevels(music: MusicDto) {
    if (this.selectedMusic?.id === music.id) {
      this.selectedMusic = null;
      this.notes = [];
      return;
    }
    this.selectedMusic = music;
    this.fireStoreService.getMusicNotes(music.id).then(n => this.notes = n)
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
