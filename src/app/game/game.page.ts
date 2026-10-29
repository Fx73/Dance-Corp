import { Location } from '@angular/common'
import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren, inject } from '@angular/core'
import { ActivatedRoute, Router } from "@angular/router"
import { IonButton, IonCard, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular'
import { IMusicPlayer, MusicOrigin, MusicPlayerCommon } from './music-player/IMusicPlayer'

import { FormsModule } from '@angular/forms'
import { addIcons } from 'ionicons'
import { arrowBack } from 'ionicons/icons'
import { AnnouncerService } from 'src/app/services/gameplay/announcer.service'
import { UserConfigService } from "src/app/services/userconfig.service"
import { AppComponent } from '../app.component'
import { MusicCacheService } from '../services/local-storage/music.cache.service'
import { UserCacheService } from '../services/local-storage/user.cache.service'
import { PresenceService } from '../services/thirdpartyapp/presence.service'
import { ArrowDirection } from "./constants/arrow-direction.enum"
import { GameOverComponent } from "./game-display/game-over/game-over.component"
import { PlayerDisplayComponent } from "./game-display/player-display.component"
import { WaitingScreenComponent } from "./game-display/waiting-screen/waiting-screen.component"
import { MusicDto, NoteDataDto } from "./game-model/music.dto"
import { GameManager } from './game.manager'
import { MusicPlayerLocalComponent } from "./music-player/music-player-local/music-player-local.component"
import { MusicPlayerSoundcloudComponent } from './music-player/music-player-soundcloud/music-player-soundcloud.component'
import { MusicPlayerYoutubeComponent } from "./music-player/music-player-youtube/music-player-youtube.component"

@Component({
  selector: 'app-game',
  templateUrl: './game.page.html',
  styleUrls: ['./game.page.scss'],
  standalone: true,
  imports: [IonIcon, IonCard, IonContent, IonHeader, IonTitle, IonToolbar, FormsModule, PlayerDisplayComponent, GameOverComponent, WaitingScreenComponent, MusicPlayerYoutubeComponent, MusicPlayerSoundcloudComponent, MusicPlayerLocalComponent, IonButton]
})
export class GamePage implements OnInit, OnDestroy, AfterViewInit {
  //#region App Constants
  readonly ArrowDirection = ArrowDirection
  readonly MusicOrigin = MusicOrigin
  //#endregion

  private cdr = inject(ChangeDetectorRef)
  private route = inject(ActivatedRoute)
  private userConfigService = inject(UserConfigService)
  private userCacheService = inject(UserCacheService)
  private musicCacheService = inject(MusicCacheService)
  private router = inject(Router)
  private location = inject(Location)
  private announcerService = inject(AnnouncerService)
  private discordRpcService = inject(PresenceService)

  //#region Loading
  loadingMusic: boolean = true
  @ViewChild(WaitingScreenComponent) waitingScreen!: WaitingScreenComponent
  //#endregion

  //#region Game
  game: GameManager | null = null
  music: MusicDto | null = null
  musicOrigin: MusicOrigin | null = null
  //#endregion

  constructor() {
    addIcons({ arrowBack })
  }

  ngOnInit() {
    // Get Data
    const musicId = this.route.snapshot.paramMap.get('musicId')
    const chartNames = this.route.snapshot.queryParamMap.getAll('notes')

    if (!musicId || chartNames.length === 0) {
      console.error("Music data is missing or incomplete.")
      void this.router.navigate(['/home'])
      return
    }

    const music = this.musicCacheService.GetMusic(musicId)
    if (!music) {
      console.error(`Music with ID ${musicId} not found. Your cache might be corrupted.`)
      void this.router.navigate(['/home'])
      return
    }
    this.music = music

    const selectedNotes = chartNames
      .map(name => music.noteData.find(n => n.chartName === name))
      .filter((note): note is NoteDataDto => note !== undefined)
    if (selectedNotes.length !== chartNames.length) {
      console.error(`Chart not found in music ${musicId}: ${chartNames.join(', ')}`)
      void this.router.navigate(['/home'])
      return
    }

    // Prepare Music Player
    this.musicOrigin = MusicPlayerCommon.PickMusicPlayer(this.music.music)
    if (this.musicOrigin == null) {
      AppComponent.PresentWarningToast("Error loading music in player !")
      void this.router.navigate(['/home'])
      return
    }

    const players = this.userConfigService.players
    const isTrainingMode: boolean = this.userConfigService.GetConfig()["trainingMode"]
    this.game = new GameManager(this.music, players, selectedNotes, isTrainingMode, this.userCacheService, this.announcerService)
    this.announcerService.PickPreferredAnnouncer()

    void this.discordRpcService.Update("Dancing on lvl " + selectedNotes[0].meter, this.music.title + " - " + this.music.artist)
  }

  @ViewChildren(PlayerDisplayComponent) playerDisplaysQuery!: QueryList<PlayerDisplayComponent>
  private playerDisplays: PlayerDisplayComponent[] = []
  ngAfterViewInit() {
    this.playerDisplays = this.playerDisplaysQuery.toArray()
    if (this.musicPlayer && this.playerDisplays.length > 0)
      this.InitGame()
  }

  private musicPlayer: IMusicPlayer | null = null
  OnPlayerReady(mPlayer: IMusicPlayer) {
    this.musicPlayer = mPlayer
    if (this.playerDisplays.length > 0)
      this.InitGame()
  }

  private hasGameBeenInitialized = false
  InitGame() {
    if (this.hasGameBeenInitialized || !this.musicPlayer || !this.game) return
    this.hasGameBeenInitialized = true

    this.game.RegisterExternalComponents(this.musicPlayer, /*this.playerDisplays*/)

    this.waitingScreen.StartCountdown()
    void this.announcerService.PlayCountdownFromAnnouncer()

    this.cdr.detectChanges()
  }

  HandleCountdownFinished() {
    this.loadingMusic = false
    this.game?.StartGame().catch(error => {
      AppComponent.PresentErrorToast("The music could not start: " + error)
      void this.router.navigate(['/play/browse'])
    })
  }

  ngOnDestroy(): void {
    try {
      this.game?.musicPlayer.Stop()
    } catch (e) {
      console.warn("Error stopping music player on game destroy:", e)
    }
    this.game?.DestroyGame()
    this.game = null
    console.log("Game destroyed")
  }

  GoBack(): void {
    this.location.back()
  }

}
