import { ChangeDetectorRef, Component, ElementRef, OnInit, QueryList, ViewChildren, signal } from '@angular/core';
import { InfiniteScrollCustomEvent, IonBadge, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonImg, IonInfiniteScroll, IonInfiniteScrollContent, IonMenu, IonSearchbar, IonSplitPane, IonText } from '@ionic/angular/standalone';
import { MusicDto, NoteDataDto } from 'src/app/game/gameModel/music.dto';
import { NgClass, NgStyle, } from '@angular/common';
import { UserMusicDto, UserNoteDto } from '../user-profile/user.dto';

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
import { MusicCacheService } from '../../services/localStorage/music.cache.service';
import { NoteDifficulty } from 'src/app/game/constants/note-difficulty.enum';
import { PresenceService } from '../../services/thirdpartyapp/presence.service';
import { RadarScoreComponent } from "src/app/shared/component/radar-score/radar-score.component";
import { Router } from '@angular/router';
import { UserCacheService } from 'src/app/services/localStorage/user.cache.service';
import { UserConfigService } from 'src/app/services/userconfig.service';
import { UserFirestoreService } from './../../services/firestore/user.firestore.service';
import { musicLocalService } from 'src/app/services/localStorage/local.music.service';

@Component({
  selector: 'app-browse',
  templateUrl: './browse.page.html',
  styleUrls: ['./browse.page.scss'],
  standalone: true,
  imports: [IonBadge, IonSplitPane, IonCardSubtitle, IonMenu, IonText, IonCardContent, IonCardTitle, IonInfiniteScrollContent, IonImg, IonInfiniteScroll, IonSearchbar, IonCard, IonCardHeader, IonContent, NgStyle, NgClass, FormsModule, HeaderComponent, GradeComponent, RadarScoreComponent]
})
export class BrowsePage implements OnInit {
  readonly DanceType = DanceType;

  dbMusics = signal<MusicDto[]>([]);
  storedMusics = signal<MusicDto[]>([]);

  musicNotes = signal<NoteDataDto[]>([]);
  musicUserScore = signal<UserMusicDto | null>(null);

  userScores: { [key: string]: number } = {};

  searchQuery: string = '';

  selectedMusicIndex = signal<number>(0);
  selectedNotesIndex = signal<number[]>([]);

  dancepad: IDancePad[] = []

  @ViewChildren('musicCard', { read: ElementRef }) musicCards!: QueryList<ElementRef>;

  constructor(private router: Router, private cd: ChangeDetectorRef, private localMusicService: musicLocalService, private musicCacheService: MusicCacheService, private userFirestoreService: UserFirestoreService, private userConfigService: UserConfigService, private userCacheService: UserCacheService, private discordRpcService: PresenceService) { }

  ngOnInit() {
    this.searchQuery = localStorage.getItem('browseSearchQuery') ?? '';
    this.selectedNotesIndex.set(new Array(this.userConfigService.players.length).fill(0));

    this.initIonInfinite();

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
        this.onSelectMusic(Math.min(this.storedMusics().length + this.dbMusics().length - 1, this.selectedMusicIndex() + 1));
      }
      if (padstate[ArrowDirection.Down]) {
        const notesLength = this.musicNotes().length;
        this.onSelectNote(Math.min(notesLength - 1, (this.selectedNotesIndex()[index] ?? 0) + 1), index);
      }
      if (padstate[ArrowDirection.Up]) {
        this.onSelectNote(Math.max(0, (this.selectedNotesIndex()[index] ?? 0) - 1), index);
      }
    }
    if (this.isListeningInput)
      setTimeout(() => this.listenInput(), 100);
  }
  //#endregion

  getSelectedMusic(index: number): MusicDto | null {
    if (index >= 0) {
      if (index < this.storedMusics().length)
        return this.storedMusics()[index];
      else
        return this.dbMusics()[index - this.storedMusics().length];
    }
    return null;
  }

  trySetSelectedMusicById(musicId: string) {
    let index = this.storedMusics().findIndex((m: { id: string; }) => m.id === musicId);

    if (index === -1) {
      index = this.dbMusics().findIndex((m: { id: string; }) => m.id === musicId) + this.storedMusics().length;
    }

    if (index === -1) {
      this.onSelectMusic(0);
    }
    else {
      this.onSelectMusic(index);
    }
  }


  onSelectMusic(listIndex: number) {
    const music = this.getSelectedMusic(listIndex);
    if (!music) {
      this.musicNotes.set([]);
      return;
    }

    const isSinglePlayer = this.userConfigService.players.length === 1;
    const filteredNotes = music.noteData.filter(note => !isSinglePlayer || note.stepsType === DanceType.DanceSingle) ?? [];

    this.musicNotes.set(filteredNotes);

    this.selectedMusicIndex.set(listIndex);
    localStorage.setItem('lastMusicSelectedId', music.id);

    this.musicUserScore.set(this.userCacheService.getMusicStats(music.id));

    setTimeout(() => {
      const el = this.musicCards.toArray()[listIndex]?.nativeElement;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }
  onSelectNote(noteIdx: number, playerIndex: number = 0) {
    this.selectedNotesIndex()[playerIndex] = noteIdx;
    this.cd.markForCheck();
  }

  onSearch(event: any) {
    this.searchQuery = (event.target.value || '').toLowerCase();
    localStorage.setItem('browseSearchQuery', this.searchQuery);

    this.initIonInfinite();
  }

  initIonInfinite() {
    const q = this.searchQuery.toLowerCase();

    let updateDbMusics = this.musicCacheService.allRemoteMusics;
    let updateLocalMusics = this.localMusicService.allLocalMusics;

    if (q) {
      updateLocalMusics =
        this.localMusicService.allLocalMusics.filter(m =>
          m.title!.toLowerCase().includes(q) ||
          m.artist!.toLowerCase().includes(q)
        )
      updateDbMusics =
        this.musicCacheService.allRemoteMusics.filter(m =>
          m.title!.toLowerCase().includes(q) ||
          m.artist!.toLowerCase().includes(q)
        )
    }

    this.storedMusics.set(updateLocalMusics);
    this.dbMusics.set(updateDbMusics);

    const lastId = localStorage.getItem('lastMusicSelectedId');
    const localIndex = lastId ? updateLocalMusics.findIndex(m => m.id === lastId) : -1;
    const remoteIndex = lastId ? updateDbMusics.findIndex(m => m.id === lastId) : -1;

    let newIndex = localIndex !== -1 ? localIndex : (remoteIndex !== -1 ? remoteIndex + updateLocalMusics.length : 0);
    this.onSelectMusic(newIndex);
  }

  onIonInfinite(event: InfiniteScrollCustomEvent) {
    console.info("Congratz, you found the infinite scroll ! But there is no more music to load :)");
    event.target.complete();
  }


  runGame(): void {
    const selectedMusic = this.getSelectedMusic(this.selectedMusicIndex());
    if (!selectedMusic) return;
    console.log("Selected music for game:", selectedMusic, "with notes:", this.musicNotes());

    this.router.navigate(['/game', selectedMusic.id], {
      queryParams: {
        notes: this.selectedNotesIndex(),
      }
    });
  }

  //#region Utils

  getSelectedNotesDifficulty(): DifficultyCriteria[] {
    const notes = this.musicNotes().filter((note, index) => this.selectedNotesIndex().includes(index));
    return notes.map(note => note.difficultyCriterias).filter((d): d is DifficultyCriteria => d !== undefined);
  }
  getPlayersForNote(noteIndex: number): number[] {
    return this.selectedNotesIndex()
      .map((selectedIdx, player) => selectedIdx === noteIndex ? player : null)
      .filter((v): v is number => v !== null);
  }

  getPlayerColor(playerIndex: number): string {
    return CONFIG.PLAYER_COLORS[playerIndex % CONFIG.PLAYER_COLORS.length].stroke;
  }
  getNoteColor(difficulty: NoteDifficulty): string {
    return Color.noteDifficultyColor(difficulty)
  }
  getGrade(score: number): string {
    return "A"
  }
  getUserNote(chartname: string): UserNoteDto | null {
    return this.musicUserScore()?.notes.find(n => n.id === chartname) ?? null;
  }
  //#endregion
}
