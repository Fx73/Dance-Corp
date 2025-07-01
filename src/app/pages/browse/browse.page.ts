import { Component, OnInit } from '@angular/core';
import { InfiniteScrollCustomEvent, IonBadge, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCol, IonContent, IonGrid, IonHeader, IonImg, IonInfiniteScroll, IonInfiniteScrollContent, IonItem, IonLabel, IonList, IonMenu, IonRow, IonSearchbar, IonSplitPane, IonTab, IonText, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { MusicDto, NoteDataDto } from 'src/app/game/gameModel/music.dto';

import { Color } from 'src/app/game/constants/color';
import { CommonModule } from '@angular/common';
import { DanceType } from 'src/app/game/constants/dance-type.enum';
import { FormsModule } from '@angular/forms';
import { GradeComponent } from "../../shared/component/grade/grade.component";
import { HeaderComponent } from "src/app/shared/component/header/header.component";
import { MusicCacheService } from './../../services/dataCache/music.cache.service';
import { MusicFirestoreService } from 'src/app/services/firestore/music.firestore.service';
import { NoteDifficulty } from 'src/app/game/constants/note-difficulty.enum';
import { Router } from '@angular/router';
import { UserConfigService } from 'src/app/services/userconfig.service';
import { UserFirestoreService } from './../../services/firestore/user.firestore.service';

@Component({
  selector: 'app-browse',
  templateUrl: './browse.page.html',
  styleUrls: ['./browse.page.scss'],
  standalone: true,
  imports: [IonSplitPane, IonCardSubtitle, IonMenu, IonText, IonCardContent, IonCardTitle, IonInfiniteScrollContent, IonImg, IonInfiniteScroll, IonSearchbar, IonCard, IonCardHeader, IonContent, CommonModule, FormsModule, HeaderComponent, GradeComponent]
})
export class BrowsePage implements OnInit {
  readonly DanceType = DanceType;

  musics: MusicDto[] = [];
  notes: NoteDataDto[] | undefined;
  userScores: { [key: string]: number } = {};
  selectedMusic: MusicDto | null = null;
  searchQuery: string = '';

  isSinglePlayer: boolean = true;

  constructor(private router: Router, private fireStoreService: MusicFirestoreService, private musicCacheService: MusicCacheService, private userFirestoreService: UserFirestoreService, private userConfigService: UserConfigService) { }

  ngOnInit() {
    this.fireStoreService.GetAllMusics(null).then(value => this.musics = value);
    this.isSinglePlayer = this.userConfigService.players.length === 1;
  }

  runGame(note: NoteDataDto): void {
    if (!this.selectedMusic)
      return

    this.selectedMusic.noteData = [note]
    this.router.navigate(['/game'], {
      state: {
        music: this.selectedMusic,
      }
    });
  }


  showLevels(music: MusicDto) {
    if (this.selectedMusic?.id === music.id) {
      this.selectedMusic = null;
      this.notes = [];
      return;
    }
    this.selectedMusic = music;
    this.musicCacheService.getMusicNotes(music.id, this.isSinglePlayer).then(n => this.notes = n)
    if (this.userFirestoreService.getUserData())
      this.userFirestoreService.getScoresForMusic(this.selectedMusic.id, this.userFirestoreService.getUserData()!.id).then(score => this.userScores = score)
  }
  getNoteColor(difficulty: NoteDifficulty | undefined): string {
    let color = "grey"
    if (difficulty)
      color = Color.noteDifficultyColor(difficulty)
    return color
  }
  getGrade(score: number): string {
    return "A"
  }

  onSearch(event: any) {
    this.searchQuery = event.target.value.toLowerCase();
    this.fireStoreService.GetAllMusicsWithSearch(null, this.searchQuery).then(value => this.musics = value);
  }

  onIonInfinite(event: InfiniteScrollCustomEvent) {
    const lastMusic: MusicDto = this.musics.at(-1)!
    if (this.searchQuery === '')
      this.fireStoreService.GetAllMusics(lastMusic?.id ?? null).then(value => this.musics = this.musics.concat(value)).catch((e) => { console.log(e.message); event.target.complete() });
    else
      this.fireStoreService.GetAllMusicsWithSearch(lastMusic?.id ?? null, this.searchQuery).then(value => this.musics = this.musics.concat(value)).catch((e) => { console.log(e.message); event.target.complete() });
  }


}
