import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCol, IonContent, IonGrid, IonIcon, IonImg, IonInput, IonItem, IonLabel, IonList, IonRow, IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { Measures, MusicDto } from 'src/app/game/gameModel/music.dto';
import { addOutline, checkmarkCircle, closeCircle, removeOutline, trashOutline } from 'ionicons/icons';

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DanceType } from './../../game/constants/dance-type.enum';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from "src/app/shared/header/header.component"; // Importer le SmReader
import { HttpClient } from '@angular/common/http';
import { MusicFirestoreService } from 'src/app/services/firestore/music.firestore.service';
import { NoteDifficulty } from './../../game/constants/note-difficulty.enum';
import { SccReader } from './reader.ssc';
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
  private readonly MUSICEDIT_STORAGE_KEY = "musicEdit"
  readonly DanceTypeList = Object.values(DanceType);
  readonly NoteDifficultyList = Object.values(NoteDifficulty);
  //#endregion

  musicData: MusicDto | null = null;
  isEditing = false;

  constructor(private fireStoreService: MusicFirestoreService) {
    addIcons({ trashOutline, removeOutline, addOutline, checkmarkCircle, closeCircle });

    const storedData = localStorage.getItem(this.MUSICEDIT_STORAGE_KEY);
    if (storedData) {
      this.musicData = JSON.parse(storedData);
    }
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        this.musicData = SccReader.parseFile(file.name, content);
        console.log(this.musicData)
        this.saveChanges();
      };
      reader.readAsText(file);
    }
  }

  validateAndUpload(): void {
    if (this.musicData) {
      this.fireStoreService.uploadNewMusic(this.musicData).then(() => {
        console.log('Music uploaded successfully!');
      }).catch((error: any) => {
        console.error('Error uploading music:', error);
      });
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
      localStorage.setItem(this.MUSICEDIT_STORAGE_KEY, JSON.stringify(this.musicData));
    }
  }

  deleteFile() {
    this.musicData = null;
    localStorage.removeItem(this.MUSICEDIT_STORAGE_KEY);
  }
}
