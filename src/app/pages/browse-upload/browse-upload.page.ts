import { Component, OnInit } from '@angular/core';
import { InfiniteScrollCustomEvent, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonImg, IonInfiniteScroll, IonInfiniteScrollContent, IonSearchbar, IonText } from '@ionic/angular/standalone';
import { MusicDto, NoteDataDto } from 'src/app/game/gameModel/music.dto';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from "src/app/shared/component/header/header.component";
import { MusicFirestoreService } from 'src/app/services/firestore/music.firestore.service';
import { Router } from '@angular/router';
import { SccReader } from '../upload/reader.ssc';
import { UploadPage } from '../upload/upload.page';
import { UserFirestoreService } from '../../services/firestore/user.firestore.service';

@Component({
  selector: 'app-browse-upload',
  templateUrl: './browse-upload.page.html',
  styleUrls: ['./browse-upload.page.scss'],
  standalone: true,
  imports: [IonCardSubtitle, IonCardContent, IonCardTitle, IonInfiniteScrollContent, IonImg, IonInfiniteScroll, IonSearchbar, IonCard, IonCardHeader, IonContent, CommonModule, FormsModule, HeaderComponent]
})
export class BrowseUploadPage implements OnInit {

  musics: MusicDto[] = [];
  notes: NoteDataDto[] | undefined;
  userScores: { [key: string]: number } = {};
  searchQuery: string = '';

  storedMusic: MusicDto | null = null;

  constructor(private router: Router, private fireStoreService: MusicFirestoreService, private userFirestoreService: UserFirestoreService) { }

  ngOnInit() {
    this.fireStoreService.GetAllMusics(null).then(value => this.musics = value);
    this.storedMusic = UploadPage.readLocalMusic();

  }



  pickMusic(music: MusicDto | null = null) {
    if (music !== null)
      this.router.navigate(['/upload'], { queryParams: { music: music.id } });
    else
      this.router.navigate(['/upload']);

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
