import { CommonModule, Location } from '@angular/common'
import { ChangeDetectorRef, Component, ElementRef, QueryList, ViewChild, ViewChildren, inject, signal } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCol, IonContent, IonGrid, IonIcon, IonInput, IonItem, IonLabel, IonList, IonRow, IonSpinner, ModalController } from '@ionic/angular'
import { BaseDirectory, mkdir, readDir, remove, writeFile } from '@tauri-apps/plugin-fs'
import { addOutline, checkmarkCircle, closeCircle, folder, logoSoundcloud, logoYoutube, removeOutline, trashOutline } from 'ionicons/icons'
import { Measures, MusicDto, NoteDataDto } from 'src/app/game/game-model/music.dto'
import { MusicOrigin, MusicPlayerCommon } from 'src/app/game/music-player/IMusicPlayer'
import { IMusicEditableField, MUSIC_EDITABLE_FIELD_TOKEN } from './editable-field.interface'
import { SccReader, SccWriter } from './reader.ssc'

import { FormsModule } from '@angular/forms'
import { addIcons } from 'ionicons'
import { AppComponent } from 'src/app/app.component'
import { MusicPlayerLocalComponent } from "src/app/game/music-player/music-player-local/music-player-local.component"
import { MusicFirestoreService } from 'src/app/services/firestore/music.firestore.service'
import { UserFirestoreService } from 'src/app/services/firestore/user.firestore.service'
import { MusicLocalService } from 'src/app/services/local-storage/local.music.service'
import { MusicCacheService } from 'src/app/services/local-storage/music.cache.service'
import { HeaderComponent } from 'src/app/shared/component/header/header.component'
import { RadarScoreComponent } from "src/app/shared/component/radar-score/radar-score.component"
import isTauri from 'src/app/shared/utils/tauri'
import { MusicPlayerSoundcloudComponent } from "../../game/music-player/music-player-soundcloud/music-player-soundcloud.component"
import { MusicPlayerYoutubeComponent } from "../../game/music-player/music-player-youtube/music-player-youtube.component"
import { DanceType } from './../../game/constants/dance-type.enum'
import { NoteDifficulty } from './../../game/constants/note-difficulty.enum'
import { MusicEditableFieldAutocompleteComponent } from './editable-field-autocomplete/editable-field-autocomplete.component'
import { MusicEditableFieldComponent } from './editable-field/editable-field.component'
import { MusicEditableListComponent } from './editable-list/editable-list.component'
import { MusicSelectComponent } from './select/select.component'
import { TestNoteComponent } from './test-note/test-note.component'

@Component({
  selector: 'app-upload',
  templateUrl: './upload.page.html',
  styleUrls: ['./upload.page.scss'],
  standalone: true,
  imports: [IonSpinner, MusicEditableFieldComponent, MusicEditableFieldAutocompleteComponent, MusicEditableListComponent, IonCardSubtitle, IonCol, IonRow, IonGrid, IonInput, IonItem, IonLabel, IonList, FormsModule, IonIcon, IonButton, IonCardTitle, IonCardContent, IonCardHeader, IonCard, IonContent, CommonModule, FormsModule, HeaderComponent, IonButton, MusicPlayerYoutubeComponent, MusicPlayerSoundcloudComponent, MusicPlayerLocalComponent, RadarScoreComponent, MusicSelectComponent]
})
export class UploadPage {
  //#region Constants
  public static readonly MUSICEDIT_STORAGE_KEY = (musicId: string) => `MUSICEDIT_${musicId}`
  pickMusicPlayer = MusicPlayerCommon.PickMusicPlayer
  MusicOrigin = MusicOrigin
  isDesktop = isTauri
  readonly DanceTypeList = Object.values(DanceType)
  readonly NoteDifficultyList = Object.values(NoteDifficulty)
  //#endregion

  private modalController = inject(ModalController)
  private route = inject(ActivatedRoute)
  private fireStoreService = inject(MusicFirestoreService)
  private userService = inject(UserFirestoreService)
  private localMusicService = inject(MusicLocalService)
  private musicCacheService = inject(MusicCacheService)
  private cd = inject(ChangeDetectorRef)
  private location = inject(Location)
  private router = inject(Router)

  musicData: MusicDto = new MusicDto()
  musicDataDb: MusicDto | null = null
  isEditDB = signal(false)
  isEditLocal = signal(false)

  isLoading = false

  genreOptions: string[] = []

  @ViewChild('metadataCard', { read: ElementRef })
  metadataCard!: ElementRef
  @ViewChildren('notesCard', { read: ElementRef })
  notesCards!: QueryList<ElementRef>

  @ViewChildren(MUSIC_EDITABLE_FIELD_TOKEN)
  editableFields!: QueryList<IMusicEditableField>
  @ViewChildren(MusicEditableListComponent)
  editableLists!: QueryList<MusicEditableListComponent>
  @ViewChildren(MusicSelectComponent)
  selects!: QueryList<MusicSelectComponent>

  metadataDirty = signal(false)
  notesDirty = signal<boolean[]>([])

  constructor() {
    addIcons({ logoYoutube, logoSoundcloud, folder, trashOutline, removeOutline, addOutline, checkmarkCircle, closeCircle })

  }

  ionViewWillEnter() {
    this.musicData = new MusicDto()
    this.musicDataDb = null
    this.isEditDB.set(false)
    this.isEditLocal.set(false)
    this.fireStoreService.GetGenres().then(genres => this.genreOptions = genres)

    const musicId = this.route.snapshot.queryParamMap.get('music')
    if (musicId) {
      this.StartLoad(musicId)
    }
  }

  //#region Dirty state management

  UpdateGlobalDirty() {
    const cardMetadata = [
      ...this.editableFields.filter(f => this.metadataCard.nativeElement.contains(f.elementRef.nativeElement)),
      ...this.editableLists.filter(l => this.metadataCard.nativeElement.contains(l.elementRef.nativeElement)),
      ...this.selects.filter(s => this.metadataCard.nativeElement.contains(s.elementRef.nativeElement)),
    ]

    this.metadataDirty.set(
      cardMetadata.some(c => c.isDirty)
    )

    const dirtyArray = new Array(this.notesCards.length).fill(false)
    for (let index = 0; index < this.notesCards.length; index++) {
      const card = this.notesCards.get(index)
      if (!card) continue
      const cardNote = [
        ...this.editableFields.filter(f => card.nativeElement.contains(f.elementRef.nativeElement)),
        ...this.editableLists.filter(l => card.nativeElement.contains(l.elementRef.nativeElement)),
        ...this.selects.filter(s => card.nativeElement.contains(s.elementRef.nativeElement)),
      ]

      dirtyArray[index] = cardNote.some(c => c.isDirty)
    }

    this.notesDirty.set(dirtyArray)
  }

  AnyNoteDirty(): boolean {
    return this.notesDirty().some(d => d)
  }
  //#endregion

  //#region Load
  async StartLoad(musicId: string) {
    this.isLoading = true
    this.LoadLocalMusic(musicId)
    await this.LoadDbMusic(musicId)

    if (!this.isEditLocal() && !this.musicDataDb) {
      this.isLoading = false
      this.cd.markForCheck()
      AppComponent.PresentErrorToast("Music not found in local storage or database.")
    }
  }

  async LoadDbMusic(musicId: string) {
    const data = await this.musicCacheService.GetMusicWithCheck(musicId)
    if (data) {
      this.musicDataDb = data
      this.isEditDB.set(true)
      this.isLoading = false

      this.cd.markForCheck()

      setTimeout(() => {
        this.UpdateGlobalDirty()
        this.cd.markForCheck()
      })
    }
  }

  LoadLocalMusic(musicId: string) {
    const data = this.localMusicService.GetMusic(musicId)
    if (data) {
      this.musicData = data
      this.isEditLocal.set(true)
      this.isLoading = false

      if (this.musicDataDb)
        this.UpdateGlobalDirty()

      this.cd.markForCheck()

    }
  }

  SwitchToDbPage() {
    this.router.navigate(['/upload'], {
      queryParams: { music: this.musicData.id },
      replaceUrl: true,
    })
    this.StartLoad(this.musicData.id)
  }
  //#endregion

  //#region New Music

  OnFileSelected(event: Event): void {
    const file: File | undefined = (event.target as HTMLInputElement).files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const content = e.target?.result as string
        this.musicData = SccReader.ParseFile(file.name, content)
        this.localMusicService.UpdateMusic(this.musicData)
        this.isEditLocal.set(true)
        AppComponent.PresentOkToast("Music loaded successfully : " + this.musicData.id)

        const dbMusic = await this.musicCacheService.GetMusic(this.musicData.id)
        if (dbMusic) {
          for (const field of this.fireStoreService.GetProtectedFields(dbMusic.noteData.length)) {
            Object.assign(this.musicData, { [field]: dbMusic[field] })
          }
          this.localMusicService.UpdateMusic(this.musicData)

          AppComponent.PresentWarningToast("This music already exists in the database. You are now editing the local version. Uploading will overwrite the database version.")
          this.SwitchToDbPage()
        } else {
          setTimeout(() => {
            this.UpdateGlobalDirty()
            this.cd.markForCheck()
          })
        }
      }
      reader.readAsText(file)
    }
  }

  async OnPickLocalMusic() {
    const file = await this.PickLocalMusic()
    const uri = await this.SaveLocalMusic(file, this.musicData.id)

    this.musicData.music = "local:" + uri
    this.localMusicService.UpdateMusic(this.musicData)

    this.cd.markForCheck()

    AppComponent.PresentOkToast("Music file saved successfully!")
  }

  PickLocalMusic() {
    return new Promise<File>((resolve, reject) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'audio/*'

      input.onchange = () => {
        const file = input.files?.[0]
        if (file) resolve(file)
        else reject('No file selected')
      }

      input.click()
    })
  }

  async SaveLocalMusic(file: File, musicId: string): Promise<string> {
    const extension = file.name.split('.').pop() || 'audio'
    const fileName = `${musicId}.${extension}`
    const path = `music/${fileName}`

    await mkdir("music", {
      baseDir: BaseDirectory.AppData,
      recursive: true
    })

    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)

    await writeFile(path, bytes, {
      baseDir: BaseDirectory.AppData
    })

    return path
  }

  IsLocalMusic(): boolean {
    return this.musicData?.music !== undefined && this.musicData.music.startsWith("local:")
  }

  OnStartEdit() {
    this.musicData = this.musicDataDb!.DeepClone()
    this.isEditLocal.set(true)
    this.cd.detectChanges()

  }

  ExportEssc(): void {
    const esscContent = SccWriter.WriteSscFile(this.isEditLocal() ? this.musicData : this.musicDataDb!)
    function Pick(translit?: string | null, normal?: string | null): string {
      const t = translit?.trim()
      return t ? t : (normal?.trim() ?? "")
    }

    const artist = Pick(this.isEditLocal() ? this.musicData.artisttranslit : this.musicDataDb?.artisttranslit, this.isEditLocal() ? this.musicData.artist : this.musicDataDb?.artist)
    const title = Pick(this.isEditLocal() ? this.musicData.titletranslit : this.musicDataDb?.titletranslit, this.isEditLocal() ? this.musicData.title : this.musicDataDb?.title)
    const filename = `${artist}_${title}.essc`

    const blob = new Blob([esscContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

  }
  //#endregion

  //#region Upload
  async UploadMusic(): Promise<void> {
    if (this.musicData === null || this.isEditDB()) return

    await this.musicCacheService.CreateMusicInBase(this.musicData)
    this.isEditDB.set(true)
    AppComponent.PresentOkToast("Music uploaded successfully!")
    this.SwitchToDbPage()
  }

  async UpdateMusic(): Promise<void> {
    if (this.musicData === null || !this.isEditDB()) return

    await this.musicCacheService.UpdateMusicInBase(this.musicData)
    AppComponent.PresentOkToast("Music updated successfully!")

    await this.LoadDbMusic(this.musicData.id)
    if (!this.AnyNoteDirty()) {
      this.DeleteFile(true)
    }
  }

  async UploadAllNotes(): Promise<void> {
    if (this.musicData === null || !this.isEditDB()) return
    await this.musicCacheService.UploadNotesInBase(this.musicData.id, this.musicData.noteData)
    AppComponent.PresentOkToast("All notes uploaded successfully!")

    await this.LoadDbMusic(this.musicData.id)
    if (!this.metadataDirty()) {
      this.DeleteFile(true)
    }
  }

  async UploadNote(note: NoteDataDto): Promise<void> {
    if (this.musicData === null || !this.isEditDB()) return
    await this.musicCacheService.UploadNotesInBase(this.musicData.id, [note])
    AppComponent.PresentOkToast("Note uploaded successfully!")
    await this.LoadDbMusic(this.musicData.id)

  }
  //#endregion

  //#region Delete
  DeleteFile(silent = false) {
    if (this.musicData === null) return
    const musicId = this.musicData.id
    this.localMusicService.DeleteMusic(musicId)
    this.musicData = new MusicDto()
    this.isEditLocal.set(false)

    if (!this.isEditDB()) {
      this.DeleteLocalMusicFile(musicId)
      this.location.back()
      if (!silent) AppComponent.PresentOkToast("Music has been discarded")

    } else {
      this.musicCacheService.UpdateCache().then(() => this.LoadDbMusic(musicId))
      if (!silent) AppComponent.PresentOkToast("Music changes have been removed")
    }

  }

  async DeleteMusic() {
    if (!this.musicDataDb) return
    await this.musicCacheService.DeleteMusicInBase(this.musicDataDb.id)
    this.musicDataDb = null
    this.isEditDB.set(false)
    this.cd.detectChanges()
    AppComponent.PresentOkToast("Music deleted successfully from database.")
  }

  DeleteNote(note: NoteDataDto): void {
    if (!this.musicData) return

    if (this.musicDataDb && this.musicDataDb.noteData.some(n => n.chartName === note.chartName)) {
      this.musicCacheService.DeleteNoteInBase(this.musicData.id, note)
      this.LoadDbMusic(this.musicData.id)
      AppComponent.PresentOkToast("Note deleted successfully from database.")

    } else {
      this.musicData.noteData = this.musicData.noteData.filter(n => n.chartName !== note.chartName)
      this.localMusicService.UpdateMusic(this.musicData)

    }

  }

  async DeleteLocalMusicFile(musicId: string) {
    try {
      const list = await readDir("music", {
        baseDir: BaseDirectory.AppData
      })
      const toDelete = list.filter(f => f.name?.startsWith(musicId))

      for (const file of toDelete) {
        await remove(`music/${file.name}`, {
          baseDir: BaseDirectory.AppData
        })
        console.log("Deleted local:", file.name)
      }

    } catch (err) {
      console.warn("Error while deleting local music files:", err)
    }
  }

  //#endregion

  //#region Local editing
  OnEndEditing() {
    this.localMusicService.UpdateMusic(this.musicData)
    this.UpdateGlobalDirty()
  }

  //#endregion

  GetStepCount(stepChart: Measures[], stepType: number): number {
    let count = 0
    stepChart.forEach(measure => {
      measure.steps.forEach(row => {
        row.forEach(step => {
          if (step === stepType)
            count++

        })
      })
    })
    return count
  }

  VerifyMusicUrl() {
    let url = this.musicData.music
    if (!url) return

    // remove https and www for easier processing, and query parameters for cleaner look
    url = url.replace(/^https?:\/\/www\./, "")
    url = url.split("?")[0]

    // extract start time if any
    const startMatch = url.match(/[?&](?:t|start)=(\d+)/)
    const start = startMatch ? Number(startMatch[1]) : null
    url = url.replace(/[?&](?:t|start)=(\d+)/, "")

    const isYoutubeUrl = url.startsWith('youtube.com') || url.startsWith('youtu.be')
    const isSoundcloudUrl = url.startsWith('soundcloud.com')

    if (!isYoutubeUrl && !isSoundcloudUrl) {
      AppComponent.PresentWarningToast("URL is not a valid YouTube or SoundCloud link.")
      return
    }

    this.musicData.music = url
    if (start) {
      this.musicData.musicoffset = start
    }

  }

  CheckUrl(): Promise<boolean> {
    if (!this.musicData?.music) return Promise.resolve(false)

    return new Promise((resolve, reject) => {
      fetch(this.musicData.music!, {
        method: "HEAD"
      }).then(response => {
        resolve(response.status.toString()[0] === "2")
      }).catch(() => {
        reject(false)
      })
    })
  }

  async TestNote(note: NoteDataDto) {
    const modal = await this.modalController.create({
      component: TestNoteComponent,
      componentProps: {
        noteData: note,
        music: this.musicData,
      },
      cssClass: 'large-modal'
    })
    await modal.present()
  }

  NoNotes(): boolean {
    if (!this.musicDataDb || !this.musicDataDb.noteData) return true
    return this.musicDataDb.noteData.length === 0
  }

  IsNoteMine(note: NoteDataDto): boolean {
    if (!note.creatorId || note.creatorId.trim() === "") return true
    return note.creatorId === this.userService.user?.id
  }

  GetDbNote(chartName: string): NoteDataDto | undefined {
    return this.musicDataDb?.noteData.find(n => n.chartName === chartName)
  }

}