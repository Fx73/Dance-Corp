import { ActivatedRoute, Router } from '@angular/router';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCol, IonContent, IonGrid, IonIcon, IonImg, IonInput, IonItem, IonLabel, IonList, IonRow, IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { Measures, MusicDto } from 'src/app/game/gameModel/music.dto';
import { SccReader, SccWriter } from './reader.ssc';
import { addOutline, checkmarkCircle, closeCircle, removeOutline, trashOutline } from 'ionicons/icons';

import { AppComponent } from 'src/app/app.component';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DanceType } from './../../game/constants/dance-type.enum';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from 'src/app/shared/component/header/header.component';
import { MusicFirestoreService } from 'src/app/services/firestore/music.firestore.service';
import { NoteDifficulty } from './../../game/constants/note-difficulty.enum';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.page.html',
  styleUrls: ['./upload.page.scss'],
  standalone: true,
  imports: [IonImg, IonCol, IonRow, IonGrid, IonInput, IonItem, IonLabel, IonList, FormsModule, IonIcon, IonButton, IonCardTitle, IonCardContent, IonCardHeader, IonCard, IonContent, IonSelect, IonSelectOption, CommonModule, FormsModule, HeaderComponent, IonButton]
})
export class UploadPage {

  //#region Constants
  private static readonly MUSICEDIT_STORAGE_KEY = "musicEdit"
  readonly DanceTypeList = Object.values(DanceType);
  readonly NoteDifficultyList = Object.values(NoteDifficulty);
  //#endregion

  musicData: MusicDto | null = null;
  isEditing = false;
  isEditDB = false;
  isLockedDB = false;

  constructor(private route: ActivatedRoute, private fireStoreService: MusicFirestoreService) {
    addIcons({ trashOutline, removeOutline, addOutline, checkmarkCircle, closeCircle });

  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['music'])
        this.fireStoreService.getMusicWithNotes(params['music'])
          .then(music => {
            this.musicData = music
            this.isEditDB = true
            this.isLockedDB = (music?.noteData ?? []).length > 0
          })
      else {
        this.musicData = UploadPage.readLocalMusic();
        this.checkMusicExist()
      }

    });
  }

  public static readLocalMusic(): MusicDto | null {
    const storedData = localStorage.getItem(UploadPage.MUSICEDIT_STORAGE_KEY);
    if (storedData)
      return SccReader.parseFile('stored.essc', storedData);
    else
      return null;
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        this.musicData = SccReader.parseFile(file.name, content);
        this.saveChanges();
        this.checkMusicExist();
      };
      reader.readAsText(file);
    }
  }

  async checkMusicExist() {
    if (!this.musicData) return;
    const existingMusic = await this.fireStoreService.getMusic(this.musicData.id);
    if (existingMusic) {
      AppComponent.presentWarningToast("This music already exists in the database. Switching to edit mode.");
      this.isEditDB = true;
      const notes = await this.fireStoreService.getMusicNotes(this.musicData.id);
      if (notes.length > 0) this.isLockedDB = true;
      existingMusic.noteData = notes.concat(this.musicData.noteData);
      this.musicData = existingMusic;
    }
  }

  Upload(): void {
    if (this.musicData === null) return;
    if (this.isEditDB) {
      this.fireStoreService.updateMusic(this.musicData)
    }
    else {
      this.fireStoreService.uploadNewMusic(this.musicData)
    }
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

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.saveChanges();
    }
  }

  saveChanges(): void {
    if (this.musicData) {
      localStorage.setItem(UploadPage.MUSICEDIT_STORAGE_KEY, SccWriter.writeSscFile(this.musicData, true));
    }
  }

  deleteFile() {
    this.musicData = null;
    localStorage.removeItem(UploadPage.MUSICEDIT_STORAGE_KEY);
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
}