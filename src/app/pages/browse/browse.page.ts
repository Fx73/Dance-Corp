import { ChangeDetectorRef, Component, ElementRef, HostListener, OnInit, QueryList, ViewChildren, signal } from '@angular/core';
import { InfiniteScrollCustomEvent, IonBadge, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonImg, IonInfiniteScroll, IonInfiniteScrollContent, IonMenu, IonSearchbar, IonSplitPane, IonText } from '@ionic/angular/standalone';
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
  imports: [IonBadge, IonSplitPane, IonCardSubtitle, IonMenu, IonText, IonCardContent, IonCardTitle, IonInfiniteScrollContent, IonImg, IonInfiniteScroll, IonSearchbar, IonCard, IonCardHeader, IonContent, NgStyle, NgClass, FormsModule, HeaderComponent, GradeComponent, RadarScoreComponent]
})
export class BrowsePage implements OnInit {
  readonly DanceType = DanceType;

  allStoredMusics: MusicDto[] = [];
  allRemoteMusics: MusicDto[] = [];

  musics = signal<MusicDto[]>([]);
  storedMusics: MusicDto[] = [];
  notes = signal<NoteDataDto[] | undefined>(undefined);

  userScores: { [key: string]: number } = {};

  searchQuery: string = '';

  selectedMusicIndex = signal<number>(0);
  selectedNoteIndex = signal<number[]>([]);

  dancepad: IDancePad[] = []

  isSinglePlayer: boolean = true;

  @ViewChildren('musicCard', { read: ElementRef }) musicCards!: QueryList<ElementRef>;

  constructor(private router: Router, private cd: ChangeDetectorRef, private fireStoreService: MusicFirestoreService, private localMusicService: LocalMusicService, private musicCacheService: MusicCacheService, private userFirestoreService: UserFirestoreService, private userConfigService: UserConfigService, private discordRpcService: PresenceService) { }

  ngOnInit() {
    this.searchQuery = localStorage.getItem('browseSearchQuery') ?? '';
    this.isSinglePlayer = this.userConfigService.players.length === 1;
    this.selectedNoteIndex.set(new Array(this.userConfigService.players.length).fill(0));

    // Load musics from local storage and Firestore
    this.allStoredMusics = this.localMusicService.getAllLocalMusicsFull();
    this.fireStoreService.GetAllMusics().then(value => {
      this.allRemoteMusics = value.filter(
        m => !this.allStoredMusics.some(s => s.id === m.id)
      );

      this.applySearchFilter();

      //  Restore last selected music 
      const lastMusicSelectedId = localStorage.getItem('lastMusicSelectedId');
      if (lastMusicSelectedId) {
        let index = this.storedMusics.findIndex(m => m.id === lastMusicSelectedId);

        if (index === -1) {
          index = this.musics().findIndex(m => m.id === lastMusicSelectedId)
            + this.storedMusics.length;
        }

        if (index !== -1) {
          this.onSelectMusic(index);
        }
      }
    });

    this.initPlayerInput();

    this.discordRpcService.update("Browsing");
  }


  //#region Input handling
  ionViewWillEnter() {
    window.addEventListener('keydown', this.keyHandler);
    this.isListeningInput = true;
    this.listenInput();
  }
  ionViewWillLeave() {
    window.removeEventListener('keydown', this.keyHandler);
    this.isListeningInput = false;
  }

  initPlayerInput() {
    const players = this.userConfigService.players;
    for (const player of players) {
      if (player.gamepad!.index! === -1)
        this.dancepad.push(new DancePadKeyboard(player.keyBindingKeyboard));
      else
        this.dancepad.push(new DancePadGamepad(player.gamepad!.index!, player.keyBindingGamepad));
    }
  }

  readonly blockedKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Spacebar', 'Enter'];
  private keyHandler = (event: KeyboardEvent) => {
    if (this.blockedKeys.includes(event.key)) {
      event.preventDefault();
    }
    if (event.key === 'Enter') {
      const active = document.activeElement;
      if (active?.classList?.contains('search-input') || active?.closest('.search-input')) {
        return;
      }
      this.runGame();
    }
  };

  isListeningInput = false;
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
    if (this.isListeningInput)
      setTimeout(() => this.listenInput(), 100);
  }
  //#endregion

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

    localStorage.setItem('lastMusicSelectedId', musicId);

    if (this.selectedMusicIndex() < this.storedMusics.length) {
      const fullmusic = this.localMusicService.getMusic(musicId);
      this.notes.set(fullmusic?.noteData.filter(note => !this.isSinglePlayer || note.stepsType === DanceType.DanceSingle) ?? []);
    }
    else if (this.selectedMusicIndex() - this.storedMusics.length < this.musics().length) {
      this.musicCacheService.getMusicNotes(musicId, this.isSinglePlayer).then(n => this.notes.set(n))
    }

    if (this.userFirestoreService.getUserData())
      this.userFirestoreService.getScoresForMusic(musicId, this.userFirestoreService.getUserData()!.id).then(score => this.userScores = score)

    setTimeout(() => {
      const el = this.musicCards.toArray()[listIndex]?.nativeElement;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
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
    this.searchQuery = (event.target.value || '').toLowerCase();
    localStorage.setItem('browseSearchQuery', this.searchQuery);

    this.applySearchFilter();
  }
  applySearchFilter() {
    const q = this.searchQuery.toLowerCase();

    this.storedMusics = this.allStoredMusics.filter(m =>
      m.title!.toLowerCase().includes(q) ||
      m.artist!.toLowerCase().includes(q)
    );

    this.musics.set(
      this.allRemoteMusics.filter(m =>
        m.title!.toLowerCase().includes(q) ||
        m.artist!.toLowerCase().includes(q)
      )
    );

    this.notes.set([]);
  }



  onIonInfinite(event: InfiniteScrollCustomEvent) {
    const lastMusic: MusicDto = this.musics().at(-1)!
    if (this.searchQuery === '')
      this.fireStoreService.GetAllMusics(lastMusic?.id ?? null).then(value => this.musics.update(prev => [...prev, ...value])).catch((e) => { console.log(e.message); event.target.complete() });
    else
      this.fireStoreService.GetAllMusicsWithSearch(lastMusic?.id ?? null, this.searchQuery).then(value => this.musics.update(prev => [...prev, ...value])).catch((e) => { console.log(e.message); event.target.complete() });
  }

}
