import { ActivatedRoute, Router } from '@angular/router';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCol, IonContent, IonGrid, IonIcon, IonImg, IonInput, IonItem, IonLabel, IonList, IonRow, IonSelect, IonSelectOption, ModalController } from '@ionic/angular/standalone';
import { Measures, MusicDto, NoteDataDto } from 'src/app/game/gameModel/music.dto';
import { MusicOrigin, MusicPlayerCommon } from 'src/app/game/musicPlayer/IMusicPlayer';
import { SccReader, SccWriter } from './reader.ssc';
import { addOutline, checkmarkCircle, closeCircle, removeOutline, trashOutline } from 'ionicons/icons';

import { AppComponent } from 'src/app/app.component';
import { BrowseUploadPage } from '../browse-upload/browse-upload.page';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DanceType } from './../../game/constants/dance-type.enum';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from 'src/app/shared/component/header/header.component';
import { MusicFirestoreService } from 'src/app/services/firestore/music.firestore.service';
import { MusicPlayerSoundcloudComponent } from "../../game/musicPlayer/music-player-soundcloud/music-player-soundcloud.component";
import { MusicPlayerYoutubeComponent } from "../../game/musicPlayer/music-player-youtube/music-player-youtube.component";
import { NoteDifficulty } from './../../game/constants/note-difficulty.enum';
import { TestNoteComponent } from './test-note/test-note.component';
import { UserFirestoreService } from 'src/app/services/firestore/user.firestore.service';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.page.html',
  styleUrls: ['./upload.page.scss'],
  standalone: true,
  imports: [IonCardSubtitle, IonImg, IonCol, IonRow, IonGrid, IonInput, IonItem, IonLabel, IonList, FormsModule, IonIcon, IonButton, IonCardTitle, IonCardContent, IonCardHeader, IonCard, IonContent, IonSelect, IonSelectOption, CommonModule, FormsModule, HeaderComponent, IonButton, MusicPlayerYoutubeComponent, MusicPlayerSoundcloudComponent]
})
export class UploadPage {
  //#region Constants
  public static readonly MUSICEDIT_STORAGE_KEY = (musicId: string) => `MUSICEDIT_${musicId}`;

  readonly DanceTypeList = Object.values(DanceType);
  readonly NoteDifficultyList = Object.values(NoteDifficulty);
  //#endregion

  musicData: MusicDto | null = null;
  dbMusicData: MusicDto | null = null;
  isEditProtected = false;
  isEditDB = false;


  constructor(private modalController: ModalController, private route: ActivatedRoute, private fireStoreService: MusicFirestoreService, private userService: UserFirestoreService) {
    addIcons({ trashOutline, removeOutline, addOutline, checkmarkCircle, closeCircle });

  }

  async ngOnInit() {
    const musicId = this.route.snapshot.queryParamMap.get('music');
    console.log("Music ID from query params:", musicId);
    if (musicId) {
      const storedData = localStorage.getItem(UploadPage.MUSICEDIT_STORAGE_KEY(musicId));
      if (storedData) {
        this.musicData = SccReader.parseFile(`${musicId}.essc`, storedData);
      }
      await this.loadDbMusic(musicId);

      if (!this.musicData) {
        if (!this.dbMusicData) {
          AppComponent.presentErrorToast("Music not found in local storage or database.");
          return;
        }
        this.musicData = this.dbMusicData.deepClone();
      }
    }

  }


  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        this.musicData = SccReader.parseFile(file.name, content);
        this.saveChanges();
        this.loadDbMusic(this.musicData.id);
      };
      reader.readAsText(file);
    }
  }

  async loadDbMusic(musicId: string) {
    this.dbMusicData = await this.fireStoreService.getMusicWithNotes(musicId);
    if (this.dbMusicData) {
      this.isEditDB = true;
    }
  }

  uploadMusic(): void {
    if (this.musicData === null) return;
    if (this.isEditDB) {
      this.fireStoreService.updateMusic(this.musicData)
    }
    else {
      this.fireStoreService.uploadMusic(this.musicData)
      this.isEditDB = true
    }
    this.loadDbMusic(this.musicData.id)
  }

  uploadAllNotes(): void {
    if (this.musicData === null || !this.isEditDB) return;
    this.fireStoreService.uploadAllNotes(this.musicData.id, this.musicData.noteData)
    this.loadDbMusic(this.musicData.id)

  }

  uploadNote(note: NoteDataDto): void {
    if (this.musicData === null || !this.isEditDB) return;
    this.fireStoreService.uploadNote(this.musicData.id, note)
    this.loadDbMusic(this.musicData.id)

  }

  isMusicChanged<K extends keyof MusicDto>(key: K): boolean {
    if (this.dbMusicData === null) return false;
    if (key === 'additionalFields' || key === 'noteData') return false;

    const a = this.dbMusicData?.[key];
    const b = this.musicData?.[key];
    if (Array.isArray(a) && Array.isArray(b)) {
      if (typeof a[0] === 'object')
        return !this.deepShallowEqualArrayOfObjects(a, b);
      return JSON.stringify(a) !== JSON.stringify(b);
    }
    console.log(`Comparing key: ${key}`, a, b);

    if (typeof a === 'object' && typeof b === 'object') {
      return !this.shallowEqual(a, b);
    }
    const normalize = (val: any) =>
      val === null || val === undefined || (typeof val === 'string' && val.trim() === '') ? '' : val;

    return normalize(a) !== normalize(b);
  }

  isNoteChanged<K extends keyof NoteDataDto>(note: NoteDataDto, key: K): boolean {
    const dbNote = this.dbMusicData?.noteData.find(n => n.chartName === note.chartName)

    if (!dbNote) return true;

    const a = dbNote[key];
    const b = note[key];

    if (Array.isArray(a) || typeof a === 'object') {
      return JSON.stringify(a) !== JSON.stringify(b);
    }

    return a !== b;
  }

  deepShallowEqualArrayOfObjects<T>(arr1: T[], arr2: T[]): boolean {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((item, index) => this.shallowEqual(item, arr2[index]));
  }

  shallowEqual(obj1: any, obj2: any): boolean {
    const keys1 = Object.keys(obj1).sort();
    const keys2 = Object.keys(obj2).sort();
    if (keys1.length !== keys2.length) return false;
    return keys1.every(key => obj2.hasOwnProperty(key) && obj1[key] === obj2[key]);
  }


  isMusicDirty(): boolean {
    if (!this.dbMusicData || !this.musicData) return true;

    const keys = Object.keys(this.musicData) as (keyof MusicDto)[];
    return keys.some(key => this.isMusicChanged(key));
  }

  isNoteDirty(note: NoteDataDto): boolean {
    if (!this.dbMusicData || !this.musicData) return true;

    const keys = Object.keys(note) as (keyof NoteDataDto)[];
    return keys.some(key => this.isNoteChanged(note, key));
  }

  isAnyNoteDirty(): boolean {
    if (!this.dbMusicData || !this.musicData) return true;
    return this.musicData.noteData.some(note => this.isNoteDirty(note));
  }




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

  onEndEditing() {
    this.saveChanges()
  }

  saveChanges(): void {
    if (this.musicData) {
      localStorage.setItem(UploadPage.MUSICEDIT_STORAGE_KEY(this.musicData.id), SccWriter.writeSscFile(this.musicData, true));
      BrowseUploadPage.addToEditRegistry(this.musicData.id);
    }
  }

  deleteFile() {
    if (this.musicData) {
      localStorage.removeItem(UploadPage.MUSICEDIT_STORAGE_KEY(this.musicData.id));
      BrowseUploadPage.removeFromEditRegistry(this.musicData.id);
    }
    if (this.dbMusicData) {
      this.musicData = this.dbMusicData.deepClone();
      AppComponent.presentOkToast("Changes have been removed")
    } else {
      this.musicData = null
      AppComponent.presentOkToast("Music has been deleted")
    }
  }

  deleteMusic() {
    if (!this.musicData) return;

    this.fireStoreService.deleteMusic(this.musicData.id).then(() => {
      AppComponent.presentOkToast("Music deleted successfully.");
      this.isEditDB = false;
      this.dbMusicData = null;
      this.saveChanges();
    }).catch((error: { message: string; }) => {
      AppComponent.presentErrorToast("Failed to delete music: " + error.message);
    });
  }
  deleteNote(note: NoteDataDto): void {
    if (!this.musicData) return;
    if (this.dbMusicData && this.dbMusicData.noteData.some(n => n.chartName === note.chartName)) {
      this.fireStoreService.deleteNote(this.musicData.id, note)
      this.dbMusicData.noteData = this.dbMusicData.noteData.filter(n => n.chartName !== note.chartName)
      this.saveChanges()

    } else {
      this.musicData.noteData = this.musicData.noteData.filter(n => n.chartName !== note.chartName)
    }

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

  exportEssc(): void {
    const esscContent = SccWriter.writeSscFile(this.musicData!, true);
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

  exportSsc(): void {
    const esscContent = SccWriter.writeSscFile(this.musicData!);
    const filename = `${this.musicData?.artist}_${this.musicData?.title}.ssc`;

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

  noNotes(): boolean {
    if (!this.musicData || !this.musicData.noteData) return true;
    return this.musicData.noteData.length === 0;
  }

  isNoteMine(note: NoteDataDto): boolean {
    if (!note.creatorId || note.creatorId.trim() === "") return true;
    return note.creatorId === this.userService.getUserData()?.id;
  }
  isNoteInDb(note: NoteDataDto): boolean {
    return this.dbMusicData?.noteData.some(n => n.chartName === note.chartName) ?? false;
  }
  getDbNote(chartName: string): NoteDataDto | undefined {
    return this.dbMusicData?.noteData.find(n => n.chartName === chartName);
  }

  isMusicOriginYt(): boolean {
    if (!this.musicData?.music) return false;
    return MusicPlayerCommon.pickMusicPlayer(this.musicData.music) === MusicOrigin.Youtube;
  }
  isMusicOriginSc(): boolean {
    if (!this.musicData?.music) return false;
    return MusicPlayerCommon.pickMusicPlayer(this.musicData.music) === MusicOrigin.Soundcloud;
  }

}