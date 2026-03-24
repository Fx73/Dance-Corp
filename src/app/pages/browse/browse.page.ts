import { ChangeDetectorRef, Component, HostListener, OnInit, signal } from '@angular/core';
import { InfiniteScrollCustomEvent, IonBadge, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonImg, IonInfiniteScroll, IonInfiniteScrollContent, IonItem, IonMenu, IonSearchbar, IonSplitPane, IonText } from '@ionic/angular/standalone';
import { MusicDto, NoteDataDto } from 'src/app/game/gameModel/music.dto';
import { NgClass, NgStyle, } from '@angular/common';

import { ArrowDirection } from 'src/app/game/constants/arrow-direction.enum';
import { CONFIG } from 'src/app/game/constants/game-config';
import { Color } from 'src/app/game/constants/color';
import { DancePadGamepad } from 'src/app/game/gameController/dancepad-gamepad';
import { DancePadKeyboard } from 'src/app/game/gameController/dancepad-keyboard';
import { DanceType } from 'src/app/game/constants/dance-type.enum';
import { DifficultyCriteria } from '../upload/DifficultyCriteria';
import { FormsModule } from '@angular/forms';
import { GradeComponent } from "../../shared/component/grade/grade.component";
import { HeaderComponent } from "src/app/shared/component/header/header.component";
import { IDancePad } from 'src/app/game/gameController/dancepad.interface';
import { LocalMusicService } from 'src/app/services/localStorage/local.music.service';
import { MusicCacheService } from '../../services/localStorage/music.cache.service';
import { MusicFirestoreService } from 'src/app/services/firestore/music.firestore.service';
import { NoteDifficulty } from 'src/app/game/constants/note-difficulty.enum';
import { PresenceService } from '../../services/thirdpartyapp/presence.service';
import { RadarScoreComponent } from "src/app/shared/component/radar-score/radar-score.component";
import { Router } from '@angular/router';
import { UserConfigService } from 'src/app/services/userconfig.service';
import { UserFirestoreService } from './../../services/firestore/user.firestore.service';

@Component({
  selector: 'app-browse',
  templateUrl: './browse.page.html',
  styleUrls: ['./browse.page.scss'],
  standalone: true,
  imports: [IonItem, IonBadge, IonSplitPane, IonCardSubtitle, IonMenu, IonText, IonCardContent, IonCardTitle, IonInfiniteScrollContent, IonImg, IonInfiniteScroll, IonSearchbar, IonCard, IonCardHeader, IonContent, NgStyle, NgClass, FormsModule, HeaderComponent, GradeComponent, RadarScoreComponent]
})
export class BrowsePage implements OnInit {
  readonly DanceType = DanceType;

  musics = signal<MusicDto[]>([]);
  storedMusics: MusicDto[] = [];
  notes = signal<NoteDataDto[] | undefined>(undefined);
  userScores: { [key: string]: number } = {};
  searchQuery: string = '';

  selectedMusicIndex = signal<number>(0);
  selectedNoteIndex = signal<number[]>([]);

  dancepad: IDancePad[] = []

  isSinglePlayer: boolean = true;

  constructor(private router: Router, private cd: ChangeDetectorRef, private fireStoreService: MusicFirestoreService, private localMusicService: LocalMusicService, private musicCacheService: MusicCacheService, private userFirestoreService: UserFirestoreService, private userConfigService: UserConfigService, private discordRpcService: PresenceService) { }

  ngOnInit() {
    this.storedMusics = this.localMusicService.getAllLocalMusicsFull();
    console.log("Stored Musics:", this.storedMusics);
    this.fireStoreService.GetAllMusics(null).then(value => {
      const filtered = value.filter(m => !this.storedMusics.some(s => s.id === m.id));
      this.musics.set(filtered);
    });

    this.isSinglePlayer = this.userConfigService.players.length === 1;

    const players = this.userConfigService.players;
    for (const player of players) {
      if (player.gamepad!.index! === -1)
        this.dancepad.push(new DancePadKeyboard(player.keyBindingKeyboard))
      else
        this.dancepad.push(new DancePadGamepad(player.gamepad!.index!, player.keyBindingGamepad))
    }
    this.selectedNoteIndex.set(new Array(players.length).fill(0));
    this.discordRpcService.update("Browsing")
    this.listenInput();
  }


  readonly blockedKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Spacebar', 'Enter'];
  @HostListener('window:keydown', ['$event'])
  preventScroll(event: KeyboardEvent) {
    if (this.blockedKeys.includes(event.key)) {
      event.preventDefault();
    }
    if (event.key === 'Enter') {
      this.runGame();
    }
  }

  listenInput() {
    for (let index = 0; index < this.dancepad.length; index++) {
      const padstate = this.dancepad[index].getRefreshedState();
      if (padstate[ArrowDirection.Left]) {
        this.onSelectMusic(Math.max(0, this.selectedMusicIndex() - 1));
      }
      if (padstate[ArrowDirection.Right]) {
        this.onSelectMusic(Math.min(this.storedMusics.length + this.musics().length - 1, this.selectedMusicIndex() + 1));
      }
      if (padstate[ArrowDirection.Down]) {
        this.onSelectNote(Math.min((this.notes() ?? []).length - 1, (this.selectedNoteIndex()[index] ?? 0) + 1), index);
      }
      if (padstate[ArrowDirection.Up]) {
        this.onSelectNote(Math.max(0, (this.selectedNoteIndex()[index] ?? 0) - 1), index);
      }
    }
    setTimeout(() => this.listenInput(), 100);
  }

  getSelectedMusic(): MusicDto | null {
    if (this.selectedMusicIndex() >= 0) {
      if (this.selectedMusicIndex() < this.storedMusics.length)
        return this.storedMusics[this.selectedMusicIndex()];
      else
        return this.musics()[this.selectedMusicIndex() - this.storedMusics.length];
    }
    return null;
  }

  getSelectedNotes(): NoteDataDto[] {
    const notes = []
    for (let i = 0; i < this.selectedNoteIndex().length; i++) {
      const noteIndex = this.selectedNoteIndex()[i] ?? 0;
      if (this.notes() && noteIndex >= 0 && noteIndex < this.notes()!.length) {
        notes.push(this.notes()![noteIndex]);
      }
    }

    return notes;
  }
  getSelectedNotesDifficulty(): DifficultyCriteria[] {
    return this.getSelectedNotes().map(note => note.difficultyCriterias).filter((d): d is DifficultyCriteria => d !== undefined);
  }
  getPlayersForNote(noteIndex: number): number[] {
    const playerIndexes = this.selectedNoteIndex()
      .map((picked, player) => picked === noteIndex ? player : null)
      .filter((v): v is number => v !== null)
    return playerIndexes;
  }
  getPlayerColor(playerIndex: number): string {
    return CONFIG.PLAYER_COLORS[playerIndex % CONFIG.PLAYER_COLORS.length].stroke;
  }


  runGame(): void {
    const selectedMusic = this.getSelectedMusic();
    if (!selectedMusic) return;

    selectedMusic.noteData = this.getSelectedNotes();
    this.router.navigate(['/game'], {
      state: {
        music: selectedMusic,
      }
    });
  }

  onSelectNote(noteIndex: number, playerIndex: number = 0) {
    this.selectedNoteIndex()[playerIndex] = noteIndex;
    this.cd.markForCheck();
  }

  onSelectMusic(listIndex: number) {
    this.selectedMusicIndex.set(listIndex);

    const musicId = this.getSelectedMusic()?.id;

    if (!musicId) {
      this.notes.set([]);
      return;
    }

    if (this.selectedMusicIndex() < this.storedMusics.length) {
      const fullmusic = this.localMusicService.getMusic(musicId);
      this.notes.set(fullmusic?.noteData.filter(note => !this.isSinglePlayer || note.stepsType === DanceType.DanceSingle) ?? []);
    }
    else if (this.selectedMusicIndex() - this.storedMusics.length < this.musics().length) {
      this.musicCacheService.getMusicNotes(musicId, this.isSinglePlayer).then(n => this.notes.set(n))
    }

    if (this.userFirestoreService.getUserData())
      this.userFirestoreService.getScoresForMusic(musicId, this.userFirestoreService.getUserData()!.id).then(score => this.userScores = score)
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
