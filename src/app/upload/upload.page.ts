import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from "../shared/header/header.component"; // Importer le SmReader
import { IonContent } from '@ionic/angular/standalone';
import { MusicDto } from '../game/dto/music.dto';
import { SccReader } from './reader.ssc';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.page.html',
  styleUrls: ['./upload.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, HeaderComponent]
})
export class UploadPage {
  musicData: MusicDto | null = null;

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        this.musicData = SccReader.parseFile(file.name, content);
      };
      reader.readAsText(file);
    }
  }
}
