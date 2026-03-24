import { Component, OnInit, signal } from '@angular/core';
import { InfiniteScrollCustomEvent, IonBadge, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonIcon, IonImg, IonInfiniteScroll, IonInfiniteScrollContent, IonSearchbar, IonText } from '@ionic/angular/standalone';
import { MusicDto, NoteDataDto } from 'src/app/game/gameModel/music.dto';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from "src/app/shared/component/header/header.component";
import { LocalMusicService } from 'src/app/services/localStorage/local.music.service';
import { MusicFirestoreService } from 'src/app/services/firestore/music.firestore.service';
import { PresenceService } from 'src/app/services/thirdpartyapp/presence.service';
import { Router } from '@angular/router';
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
  musics = signal<MusicDto[]>([]);
  notes = signal<NoteDataDto[] | undefined>(undefined);
  userScores: { [key: string]: number } = {};
  searchQuery: string = '';

  constructor(private router: Router, private fireStoreService: MusicFirestoreService, private localMusicService: LocalMusicService, private userFirestoreService: UserFirestoreService, private discordRpcService: PresenceService) {
    addIcons({ addCircleOutline });
  }

  ngOnInit() {
    this.discordRpcService.update("Editing")

    this.fireStoreService.GetAllMusics(null).then(value => {
      const filtered = value.filter(m => !this.storedMusics.some(s => s.id === m.id));
      this.musics.set(filtered);
    });
  }
  ionViewWillEnter() {
    this.storedMusics = this.localMusicService.getAllLocalMusics();
  }



  pickMusic(music: MusicDto | null = null) {
    if (music !== null)
      this.router.navigate(['/upload'], { queryParams: { music: music.id } });
    else
      this.router.navigate(['/upload']);

  }

  onSearch(event: any) {
    this.searchQuery = event.target.value.toLowerCase();
    this.storedMusics = this.localMusicService.getAllLocalMusics(this.searchQuery);
    this.fireStoreService.GetAllMusicsWithSearch(null, this.searchQuery).then(value => this.musics.set(value));
  }

  onIonInfinite(event: InfiniteScrollCustomEvent) {
    const lastMusic: MusicDto = this.musics().at(-1)!
    if (this.searchQuery === '')
      this.fireStoreService.GetAllMusics(lastMusic?.id ?? null).then(value => this.musics.set([...this.musics(), ...value])).catch((e) => { console.log(e.message); event.target.complete() });
    else
      this.fireStoreService.GetAllMusicsWithSearch(lastMusic?.id ?? null, this.searchQuery).then(value => this.musics.set([...this.musics(), ...value])).catch((e) => { console.log(e.message); event.target.complete() });
  }
}