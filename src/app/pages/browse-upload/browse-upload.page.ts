import { Component, OnInit } from '@angular/core';
import { InfiniteScrollCustomEvent, IonBadge, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonIcon, IonImg, IonInfiniteScroll, IonInfiniteScrollContent, IonSearchbar, IonText } from '@ionic/angular/standalone';
import { MusicDto, NoteDataDto } from 'src/app/game/gameModel/music.dto';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from "src/app/shared/component/header/header.component";
import { MusicFirestoreService } from 'src/app/services/firestore/music.firestore.service';
import { Router } from '@angular/router';
import { SccReader } from '../upload/reader.ssc';
import { UploadPage } from '../upload/upload.page';
import { UserFirestoreService } from '../../services/firestore/user.firestore.service';
import { addCircleOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-browse-upload',
  templateUrl: './browse-upload.page.html',
  styleUrls: ['./browse-upload.page.scss'],
  standalone: true,
  imports: [IonBadge, IonIcon, IonCardSubtitle, IonCardContent, IonCardTitle, IonInfiniteScrollContent, IonImg, IonInfiniteScroll, IonSearchbar, IonCard, IonCardHeader, IonContent, CommonModule, FormsModule, HeaderComponent]
})
export class BrowseUploadPage implements OnInit {

  storedMusics: MusicDto[] = [];
  musics: MusicDto[] = [];
  notes: NoteDataDto[] | undefined;
  userScores: { [key: string]: number } = {};
  searchQuery: string = '';

  constructor(private router: Router, private fireStoreService: MusicFirestoreService, private userFirestoreService: UserFirestoreService) {
    addIcons({ addCircleOutline });
    BrowseUploadPage.EditRegistry = JSON.parse(localStorage.getItem(BrowseUploadPage.MUSICEDIT_REGISTRY_KEY) ?? '[]');
    console.log(BrowseUploadPage.EditRegistry)

  }

  ngOnInit() {
    for (const musicId of BrowseUploadPage.EditRegistry) {
      const storedData = localStorage.getItem(UploadPage.MUSICEDIT_STORAGE_KEY(musicId));
      if (storedData) {
        const musicData = SccReader.extractBasicMetadataFromSSC(storedData);
        const storedMusic = new MusicDto();
        storedMusic.title = musicData.title;
        storedMusic.artist = musicData.artist;
        storedMusic.jacket = musicData.jacket;
        this.storedMusics.push(storedMusic);
      } else {
        console.warn(`⚠️ No data for music ${musicId} → cleaning registry`);
        localStorage.removeItem(UploadPage.MUSICEDIT_STORAGE_KEY(musicId));
        const index = BrowseUploadPage.EditRegistry.indexOf(musicId);
        if (index !== -1) BrowseUploadPage.EditRegistry.splice(index, 1);
      }
    }
    this.fireStoreService.GetAllMusics(null).then(value => this.musics = value);

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


  public static readonly MUSICEDIT_REGISTRY_KEY = 'REGISTRY_MUSICEDIT';
  public static EditRegistry: string[] = [];

  public static addToEditRegistry(musicId: string) {
    if (this.EditRegistry.includes(musicId)) return;
    this.EditRegistry.push(musicId);
    localStorage.setItem(BrowseUploadPage.MUSICEDIT_REGISTRY_KEY, JSON.stringify(this.EditRegistry));
  }

  public static removeFromEditRegistry(musicId: string) {
    const index = this.EditRegistry.indexOf(musicId);
    if (index !== -1) {
      this.EditRegistry.splice(index, 1);
      localStorage.setItem(BrowseUploadPage.MUSICEDIT_REGISTRY_KEY, JSON.stringify(this.EditRegistry));
    }
  }

  public static clearEditRegistry() {
    BrowseUploadPage.EditRegistry = JSON.parse(localStorage.getItem(BrowseUploadPage.MUSICEDIT_REGISTRY_KEY) ?? '[]')

    for (const musicId of BrowseUploadPage.EditRegistry) {
      const key = UploadPage.MUSICEDIT_STORAGE_KEY(musicId);
      localStorage.removeItem(key);
    }

    // Clear internal state
    BrowseUploadPage.EditRegistry = [];
    localStorage.removeItem(this.MUSICEDIT_REGISTRY_KEY);
  }
}
