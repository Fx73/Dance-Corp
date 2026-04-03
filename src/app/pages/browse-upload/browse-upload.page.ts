import { Component, OnInit, signal } from '@angular/core';
import { InfiniteScrollCustomEvent, IonBadge, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonIcon, IonImg, IonInfiniteScroll, IonInfiniteScrollContent, IonSearchbar, IonText } from '@ionic/angular/standalone';
import { MusicDto, NoteDataDto } from 'src/app/game/gameModel/music.dto';

import { AppComponent } from 'src/app/app.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from "src/app/shared/component/header/header.component";
import { MusicCacheService } from 'src/app/services/localStorage/music.cache.service';
import { MusicFirestoreService } from 'src/app/services/firestore/music.firestore.service';
import { PresenceService } from 'src/app/services/thirdpartyapp/presence.service';
import { Router } from '@angular/router';
import { UserFirestoreService } from '../../services/firestore/user.firestore.service';
import { addCircleOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { musicLocalService } from 'src/app/services/localStorage/local.music.service';

@Component({
  selector: 'app-browse-upload',
  templateUrl: './browse-upload.page.html',
  styleUrls: ['./browse-upload.page.scss'],
  standalone: true,
  imports: [IonBadge, IonIcon, IonCardSubtitle, IonCardContent, IonCardTitle, IonInfiniteScrollContent, IonImg, IonInfiniteScroll, IonSearchbar, IonCard, IonCardHeader, IonContent, CommonModule, FormsModule, HeaderComponent]
})
export class BrowseUploadPage implements OnInit {

  dbMusics = signal<MusicDto[]>([]);
  storedMusics = signal<MusicDto[]>([]);

  searchQuery: string = '';

  constructor(private router: Router, private musicCacheService: MusicCacheService, private localMusicService: musicLocalService, private discordRpcService: PresenceService) {
    addIcons({ addCircleOutline });
  }

  ngOnInit() {
    this.initIonInfinite();

    this.discordRpcService.update("Editing")
  }

  initIonInfinite() {
    const q = this.searchQuery.toLowerCase();

    let updateDbMusics = this.musicCacheService.allRemoteMusics;
    let updateLocalMusics = this.localMusicService.allLocalMusics;

    if (q) {
      updateLocalMusics =
        this.localMusicService.allLocalMusics.filter(m =>
          m.title!.toLowerCase().includes(q) ||
          m.artist!.toLowerCase().includes(q)
        )
      updateDbMusics =
        this.musicCacheService.allRemoteMusics.filter(m =>
          m.title!.toLowerCase().includes(q) ||
          m.artist!.toLowerCase().includes(q)
        )
    }

    this.storedMusics.set(updateLocalMusics);
    this.dbMusics.set(updateDbMusics);
  }



  pickMusic(music: MusicDto | null = null) {
    if (music !== null)
      this.router.navigate(['/upload'], { queryParams: { music: music.id } });
    else
      this.router.navigate(['/upload']);
  }

  onSearch(event: any) {
    this.searchQuery = (event.target.value || '').toLowerCase();
    this.initIonInfinite();
  }

  onIonInfinite(event: InfiniteScrollCustomEvent) {
    console.info("Congratz, you found the infinite scroll ! But there is no more music to load :)");
    event.target.complete();
  }
}