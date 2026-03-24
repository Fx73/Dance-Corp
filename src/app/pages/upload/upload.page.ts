import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren, signal } from '@angular/core';
import { BaseDirectory, mkdir, readDir, remove, writeFile } from '@tauri-apps/plugin-fs';
import { CommonModule, Location } from '@angular/common';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCol, IonContent, IonGrid, IonIcon, IonImg, IonInput, IonItem, IonLabel, IonList, IonRow, IonSelect, IonSelectOption, IonSpinner, ModalController } from '@ionic/angular/standalone';
import { Measures, MusicDto, NoteDataDto } from 'src/app/game/gameModel/music.dto';
import { MusicOrigin, MusicPlayerCommon } from 'src/app/game/musicPlayer/IMusicPlayer';
import { SccReader, SccWriter } from './reader.ssc';
import { addOutline, checkmarkCircle, closeCircle, folder, logoSoundcloud, logoYoutube, removeOutline, trashOutline } from 'ionicons/icons';

import { AppComponent } from 'src/app/app.component';
import { BrowseUploadPage } from '../browse-upload/browse-upload.page';
import { DanceType } from './../../game/constants/dance-type.enum';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from 'src/app/shared/component/header/header.component';
import { LocalMusicService } from 'src/app/services/localStorage/local.music.service';
import { MusicEditableFieldComponent } from './editable-field/editable-field.component';
import { MusicEditableListComponent } from './editable-list/editable-list.component';
import { MusicFirestoreService } from 'src/app/services/firestore/music.firestore.service';
import { MusicPlayerLocalComponent } from "src/app/game/musicPlayer/music-player-local/music-player-local.component";
import { MusicPlayerSoundcloudComponent } from "../../game/musicPlayer/music-player-soundcloud/music-player-soundcloud.component";
import { MusicPlayerYoutubeComponent } from "../../game/musicPlayer/music-player-youtube/music-player-youtube.component";
import { MusicSelectComponent } from './select/select.component';
import { NoteDifficulty } from './../../game/constants/note-difficulty.enum';
import { RadarScoreComponent } from "src/app/shared/component/radar-score/radar-score.component";
import { TestNoteComponent } from './test-note/test-note.component';
import { UserFirestoreService } from 'src/app/services/firestore/user.firestore.service';
import { addIcons } from 'ionicons';
import isTauri from 'src/app/shared/utils/tauri';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.page.html',
  styleUrls: ['./upload.page.scss'],
  standalone: true,
  imports: [IonSpinner, MusicEditableFieldComponent, MusicEditableListComponent, IonCardSubtitle, IonImg, IonCol, IonRow, IonGrid, IonInput, IonItem, IonLabel, IonList, FormsModule, IonIcon, IonButton, IonCardTitle, IonCardContent, IonCardHeader, IonCard, IonContent, CommonModule, FormsModule, HeaderComponent, IonButton, MusicPlayerYoutubeComponent, MusicPlayerSoundcloudComponent, MusicPlayerLocalComponent, RadarScoreComponent, MusicSelectComponent]
})
export class UploadPage {
  //#region Constants
  public static readonly MUSICEDIT_STORAGE_KEY = (musicId: string) => `MUSICEDIT_${musicId}`;
  pickMusicPlayer = MusicPlayerCommon.pickMusicPlayer;
  MusicOrigin = MusicOrigin;
  isDesktop = isTauri;
  readonly DanceTypeList = Object.values(DanceType);
  readonly NoteDifficultyList = Object.values(NoteDifficulty);
  //#endregion

  musicData: MusicDto = new MusicDto();
  musicDataDb: MusicDto | null = null;
  isEditDB = false;
  isEditLocal = false;

  isLoading = false;

  @ViewChild('metadataCard', { read: ElementRef })
  metadataCard!: ElementRef;
  @ViewChildren('notesCard', { read: ElementRef })
  notesCards!: QueryList<ElementRef>;

  @ViewChildren(MusicEditableFieldComponent)
  editableFields!: QueryList<MusicEditableFieldComponent>;
  @ViewChildren(MusicEditableListComponent)
  editableLists!: QueryList<MusicEditableListComponent>;
  @ViewChildren(MusicSelectComponent)
  selects!: QueryList<MusicSelectComponent>;

  metadataDirty = signal(false);
  notesDirty = signal<boolean[]>([]);

  constructor(private modalController: ModalController, private route: ActivatedRoute, private fireStoreService: MusicFirestoreService, private userService: UserFirestoreService, private localMusicService: LocalMusicService, private cd: ChangeDetectorRef, private location: Location, private router: Router) {
    addIcons({ logoYoutube, logoSoundcloud, folder, trashOutline, removeOutline, addOutline, checkmarkCircle, closeCircle });

  }

  ionViewWillEnter() {
    const musicId = this.route.snapshot.queryParamMap.get('music');
    console.log("UploadPage initialized with musicId:", musicId);
    if (musicId) {
      this.startLoad(musicId);
    }

  }

  //#region Dirty state management

  updateGlobalDirty() {
    const cardMetadata = [
      ...this.editableFields.filter(f => this.metadataCard.nativeElement.contains(f.elementRef.nativeElement)),
      ...this.editableLists.filter(l => this.metadataCard.nativeElement.contains(l.elementRef.nativeElement)),
      ...this.selects.filter(s => this.metadataCard.nativeElement.contains(s.elementRef.nativeElement)),
    ];

    this.metadataDirty.set(
      cardMetadata.some(c => c.isDirty)
    );


    const dirtyArray = new Array(this.notesCards.length).fill(false);
    for (let index = 0; index < this.notesCards.length; index++) {
      const card = this.notesCards.get(index);
      if (!card) continue;
      const cardNote = [
        ...this.editableFields.filter(f => card.nativeElement.contains(f.elementRef.nativeElement)),
        ...this.editableLists.filter(l => card.nativeElement.contains(l.elementRef.nativeElement)),
        ...this.selects.filter(s => card.nativeElement.contains(s.elementRef.nativeElement)),
      ];

      dirtyArray[index] = cardNote.some(c => c.isDirty)
    }

    this.notesDirty.set(dirtyArray);

    console.log("Updated dirty")
  }

  anyNoteDirty(): boolean {
    return this.notesDirty().some(d => d);
  }
  //#endregion

  //#region Load
  async startLoad(musicId: string) {
    this.isLoading = true;
    this.loadLocalMusic(musicId);
    await this.loadDbMusic(musicId);

    if (!this.musicData) {
      if (!this.musicDataDb) {
        AppComponent.presentErrorToast("Music not found in local storage or database.");
        return;
      }
      this.musicData = this.musicDataDb.deepClone();
    }
  }

  async loadDbMusic(musicId: string) {
    const data = await this.fireStoreService.getMusicWithNotes(musicId);
    if (data) {
      this.musicDataDb = data;
      this.isEditDB = true;
      this.isLoading = false;

      this.cd.markForCheck();

      setTimeout(() => {
        this.updateGlobalDirty();
        this.cd.markForCheck();
      });
    }
  }

  loadLocalMusic(musicId: string) {
    const data = this.localMusicService.getMusic(musicId);
    if (data) {
      this.musicData = data;
      this.isEditLocal = true;
      this.isLoading = false;

      if (this.musicDataDb)
        this.updateGlobalDirty();

      this.cd.markForCheck()

    }
  }

  switchToDbPage() {
    this.router.navigate(['/upload'], {
      queryParams: { music: this.musicData.id },
      replaceUrl: true,
    });
    this.startLoad(this.musicData.id);
  }
  //#endregion

  //#region New Music

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        this.musicData = SccReader.parseFile(file.name, content);
        this.localMusicService.saveMusic(this.musicData!);
        this.isEditLocal = true;
        AppComponent.presentOkToast("Music loaded successfully : " + this.musicData.id);

        const dbMusic = await this.fireStoreService.getMusic(this.musicData.id);
        if (dbMusic) {
          for (const field of this.fireStoreService.protectedFields) {
            (this.musicData as any)[field] = (dbMusic as any)[field];
          }
          this.localMusicService.saveMusic(this.musicData!);

          AppComponent.presentWarningToast("This music already exists in the database. You are now editing the local version. Uploading will overwrite the database version.");
          this.switchToDbPage();
        } else {
          setTimeout(() => {
            this.updateGlobalDirty();
            this.cd.markForCheck();
          });
        }
      };
      reader.readAsText(file);
    }
  }


  async onPickLocalMusic() {
    const file = await this.pickLocalMusic();
    const uri = await this.saveLocalMusic(file, this.musicData.id);

    this.musicData.music = "local:" + uri;
    this.localMusicService.saveMusic(this.musicData!);

    this.cd.markForCheck()

    AppComponent.presentOkToast("Music file saved successfully!");
  }

  pickLocalMusic() {
    return new Promise<File>((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'audio/*';

      input.onchange = () => {
        const file = input.files?.[0];
        if (file) resolve(file);
        else reject('No file selected');
      };

      input.click();
    });
  }


  async saveLocalMusic(file: File, musicId: string): Promise<string> {
    const extension = file.name.split('.').pop() || 'audio';
    const fileName = `${musicId}.${extension}`;
    const path = `music/${fileName}`;

    await mkdir("music", {
      baseDir: BaseDirectory.AppData,
      recursive: true
    });

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    await writeFile(path, bytes, {
      baseDir: BaseDirectory.AppData
    });

    return path;
  }

  isLocalMusic(): boolean {
    return this.musicData?.music !== undefined && this.musicData.music.startsWith("local:");
  }


  onStartEdit() {
    this.musicData = this.musicDataDb!.deepClone();
    this.isEditLocal = true;
    this.cd.detectChanges()

  }

  exportEssc(): void {
    const esscContent = SccWriter.writeSscFile(this.musicData!);
    const filename = `${this.musicData?.artist}_${this.musicData?.title}.essc`;

    const blob = new Blob([esscContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  }
  //#endregion

  //#region Upload
  async uploadMusic(): Promise<void> {
    if (this.musicData === null) return;
    if (this.isEditDB) {
      await this.fireStoreService.updateMusic(this.musicData)
      AppComponent.presentOkToast("Music updated successfully!");

      await this.loadDbMusic(this.musicData.id);
      if (!this.anyNoteDirty()) {
        this.deleteFile(true)
      }
    }
    else {
      await this.fireStoreService.uploadMusic(this.musicData)
      this.isEditDB = true
      AppComponent.presentOkToast("Music uploaded successfully!");
      this.switchToDbPage();
    }
  }

  async uploadAllNotes(): Promise<void> {
    if (this.musicData === null || !this.isEditDB) return;
    await this.fireStoreService.uploadAllNotes(this.musicData.id, this.musicData.noteData)
    AppComponent.presentOkToast("All notes uploaded successfully!");

    await this.loadDbMusic(this.musicData.id)
    if (!this.metadataDirty()) {
      this.deleteFile(true)
    }
  }

  async uploadNote(note: NoteDataDto): Promise<void> {
    if (this.musicData === null || !this.isEditDB) return;
    await this.fireStoreService.uploadNote(this.musicData.id, note)
    AppComponent.presentOkToast("Note uploaded successfully!");
    await this.loadDbMusic(this.musicData.id)

  }
  //#endregion

  //#region Delete
  deleteFile(silent = false) {
    if (this.musicData === null) return;
    const musicId = this.musicData.id;
    this.localMusicService.deleteMusic(musicId);
    this.musicData = new MusicDto();
    this.isEditLocal = false;

    if (!this.isEditDB) {
      this.deleteLocalMusicFile(musicId);
      this.location.back();
      if (!silent) AppComponent.presentOkToast("Music has been discarded");

    } else {
      if (!silent) AppComponent.presentOkToast("Music changes have been removed")
    }

  }

  async deleteMusic() {
    if (!this.musicDataDb) return;
    await this.fireStoreService.deleteMusic(this.musicDataDb.id);
    this.musicDataDb = null;
    this.isEditDB = false;
    this.cd.detectChanges()
    AppComponent.presentOkToast("Music deleted successfully from database.");
  }



  deleteNote(note: NoteDataDto): void {
    if (!this.musicData) return;

    if (this.musicDataDb && this.musicDataDb.noteData.some(n => n.chartName === note.chartName)) {
      this.fireStoreService.deleteNote(this.musicData.id, note)
      this.musicDataDb.noteData = this.musicDataDb.noteData.filter(n => n.chartName !== note.chartName)
      AppComponent.presentOkToast("Note deleted successfully from database.");

    } else {
      this.musicData.noteData = this.musicData.noteData.filter(n => n.chartName !== note.chartName)
      this.localMusicService.saveMusic(this.musicData!);

    }

  }


  async deleteLocalMusicFile(musicId: string) {
    try {
      const list = await readDir("music", {
        baseDir: BaseDirectory.AppData
      });
      const toDelete = list.filter(f => f.name?.startsWith(musicId));

      for (const file of toDelete) {
        await remove(`music/${file.name}`, {
          baseDir: BaseDirectory.AppData
        });
        console.log("Deleted local:", file.name);
      }

    } catch (err) {
      console.warn("Error while deleting local music files:", err);
    }
  }

  //#endregion

  //#region Local editing
  onEndEditing() {
    this.localMusicService.saveMusic(this.musicData!);
    this.updateGlobalDirty();
  }

  //#endregion


  getStepCount(stepChart: Measures[], stepType: number): number {
    let count = 0;
    stepChart.forEach(measure => {
      measure.steps.forEach(row => {
        row.forEach(step => {
          if (step === stepType)
            count++;

        });
      });
    });
    return count;
  }

  checkUrl(): Promise<boolean> {
    if (!this.musicData?.music) return Promise.resolve(false);

    return new Promise((resolve, reject) => {
      fetch(this.musicData!.music!, {
        method: "HEAD"
      }).then(response => {
        resolve(response.status.toString()[0] === "2")
      }).catch(error => {
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
    });
    console.log("TestNoteComponent created with noteData:", modal);
    await modal.present()
  }



  noNotes(): boolean {
    if (!this.musicDataDb || !this.musicDataDb.noteData) return true;
    return this.musicDataDb.noteData.length === 0;
  }
  isNoteMine(note: NoteDataDto): boolean {
    if (!note.creatorId || note.creatorId.trim() === "") return true;
    return note.creatorId === this.userService.getUserData()?.id;
  }
  getDbNote(chartName: string): NoteDataDto | undefined {
    return this.musicDataDb?.noteData.find(n => n.chartName === chartName);
  }


}