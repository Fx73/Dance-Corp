import { Component, OnInit, signal, inject } from '@angular/core'
import { InfiniteScrollCustomEvent, SearchbarCustomEvent, IonBadge, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonIcon, IonInfiniteScroll, IonInfiniteScrollContent, IonSearchbar } from '@ionic/angular'

import { FormsModule } from '@angular/forms'
import { HeaderComponent } from "src/app/shared/component/header/header.component"
import { MusicCacheService } from 'src/app/services/local-storage/music.cache.service'
import { MusicDto } from 'src/app/game/game-model/music.dto'
import { PresenceService } from 'src/app/services/thirdpartyapp/presence.service'
import { Router } from '@angular/router'
import { addCircleOutline } from 'ionicons/icons'
import { addIcons } from 'ionicons'
import { MusicLocalService } from 'src/app/services/local-storage/local.music.service'
import { productionConsole } from 'src/app/shared/console-output'

@Component({
  selector: 'app-browse-upload',
  templateUrl: './browse-upload.page.html',
  styleUrls: ['./browse-upload.page.scss'],
  standalone: true,
  imports: [IonBadge, IonIcon, IonCardSubtitle, IonCardContent, IonCardTitle, IonInfiniteScrollContent, IonInfiniteScroll, IonSearchbar, IonCard, IonCardHeader, IonContent, FormsModule, HeaderComponent]
})
export class BrowseUploadPage implements OnInit {
  private router = inject(Router)
  private musicCacheService = inject(MusicCacheService)
  private localMusicService = inject(MusicLocalService)
  private discordRpcService = inject(PresenceService)

  dbMusics = signal<MusicDto[]>([])
  storedMusics = signal<MusicDto[]>([])

  searchQuery: string = ''

  constructor() {
    addIcons({ addCircleOutline })
  }

  ngOnInit() {
    this.InitIonInfinite()

    void this.discordRpcService.Update("Editing")
  }

  InitIonInfinite() {
    const q = this.searchQuery.toLowerCase()

    let updateDbMusics = this.musicCacheService.allRemoteMusics
    let updateLocalMusics = this.localMusicService.allLocalMusics

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

    this.storedMusics.set(updateLocalMusics)
    this.dbMusics.set(updateDbMusics)
  }

  PickMusic(music: MusicDto | null = null) {
    if (music !== null)
      void this.router.navigate(['/upload'], { queryParams: { music: music.id } })
    else
      void this.router.navigate(['/upload'])
  }

  OnSearch(event: SearchbarCustomEvent) {
    this.searchQuery = (event.target.value || '').toLowerCase()
    this.InitIonInfinite()
  }

  OnIonInfinite(event: InfiniteScrollCustomEvent) {
    productionConsole.info("Congratz, you found the infinite scroll ! But there is no more music to load :)")
    void event.target.complete()
  }
}