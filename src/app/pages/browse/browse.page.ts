import { Component, OnInit, signal } from '@angular/core';
import { InfiniteScrollCustomEvent, IonBadge, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonImg, IonInfiniteScroll, IonInfiniteScrollContent, IonMenu, IonSearchbar, IonSplitPane, IonText } from '@ionic/angular/standalone';
import { MusicDto, NoteDataDto } from 'src/app/game/gameModel/music.dto';

import { BrowseUploadPage } from '../browse-upload/browse-upload.page';
import { Color } from 'src/app/game/constants/color';
import { CommonModule } from '@angular/common';
import { DanceType } from 'src/app/game/constants/dance-type.enum';
import { FormsModule } from '@angular/forms';
import { GradeComponent } from "../../shared/component/grade/grade.component";
import { HeaderComponent } from "src/app/shared/component/header/header.component";
import { LocalMusicService } from 'src/app/services/localStorage/local.music.service';
import { MusicCacheService } from '../../services/localStorage/music.cache.service';
import { MusicFirestoreService } from 'src/app/services/firestore/music.firestore.service';
import { NoteDifficulty } from 'src/app/game/constants/note-difficulty.enum';
import { PresenceService } from '../../services/thirdpartyapp/presence.service';
import { Router } from '@angular/router';
import { UserConfigService } from 'src/app/services/userconfig.service';
import { UserFirestoreService } from './../../services/firestore/user.firestore.service';

@Component({
  selector: 'app-browse',
  templateUrl: './browse.page.html',
  styleUrls: ['./browse.page.scss'],
  standalone: true,
  imports: [IonBadge, IonSplitPane, IonCardSubtitle, IonMenu, IonText, IonCardContent, IonCardTitle, IonInfiniteScrollContent, IonImg, IonInfiniteScroll, IonSearchbar, IonCard, IonCardHeader, IonContent, CommonModule, FormsModule, HeaderComponent, GradeComponent]
})
export class BrowsePage implements OnInit {
  readonly DanceType = DanceType;

  musics = signal<MusicDto[]>([]);
  storedMusics: MusicDto[] = [];
  notes = signal<NoteDataDto[] | undefined>(undefined);
  userScores: { [key: string]: number } = {};
  selectedMusic: MusicDto | null = null;
  searchQuery: string = '';

  isSinglePlayer: boolean = true;

  constructor(private router: Router, private fireStoreService: MusicFirestoreService, private localMusicService: LocalMusicService, private musicCacheService: MusicCacheService, private userFirestoreService: UserFirestoreService, private userConfigService: UserConfigService, private discordRpcService: PresenceService) { }

  ngOnInit() {
    this.storedMusics = this.localMusicService.getAllLocalMusicsFull();
    console.log("Stored Musics:", this.storedMusics);
    this.fireStoreService.GetAllMusics(null).then(value => {
      const filtered = value.filter(m => !this.storedMusics.some(s => s.id === m.id));
      this.musics.set(filtered);
    });

    this.isSinglePlayer = this.userConfigService.players.length === 1;

    this.discordRpcService.update("Browsing")

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
      this.notes.set([]);
      return;
    }
    this.selectedMusic = music;
    if (this.storedMusics.some(m => m.id === music.id)) {
      const fullmusic = this.localMusicService.getMusic(music.id);
      this.notes.set(fullmusic?.noteData.filter(note => !this.isSinglePlayer || note.stepsType === DanceType.DanceSingle) ?? []);
    } else {
      this.musicCacheService.getMusicNotes(music.id, this.isSinglePlayer).then(n => this.notes.set(n))
      if (this.userFirestoreService.getUserData())
        this.userFirestoreService.getScoresForMusic(this.selectedMusic.id, this.userFirestoreService.getUserData()!.id).then(score => this.userScores = score)
    }
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
    this.storedMusics = this.localMusicService.getAllLocalMusicsFull(this.searchQuery);
    this.fireStoreService.GetAllMusicsWithSearch(null, this.searchQuery).then(value => { this.musics.set(value) });
  }

  onIonInfinite(event: InfiniteScrollCustomEvent) {
    const lastMusic: MusicDto = this.musics().at(-1)!
    if (this.searchQuery === '')
      this.fireStoreService.GetAllMusics(lastMusic?.id ?? null).then(value => this.musics.update(prev => [...prev, ...value])).catch((e) => { console.log(e.message); event.target.complete() });
    else
      this.fireStoreService.GetAllMusicsWithSearch(lastMusic?.id ?? null, this.searchQuery).then(value => this.musics.update(prev => [...prev, ...value])).catch((e) => { console.log(e.message); event.target.complete() });
  }


}
