import { Component, Input, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { IMusicPlayer, MusicOrigin, MusicPlayerCommon } from 'src/app/game/music-player/IMusicPlayer';
import { MusicDto, NoteDataDto } from 'src/app/game/game-model/music.dto';

import { ArrowDirection } from 'src/app/game/constants/arrow-direction.enum';
import { GameManager } from 'src/app/game/game.manager';
import { ModalController } from '@ionic/angular';
import { MusicPlayerSoundcloudComponent } from "../../../game/music-player/music-player-soundcloud/music-player-soundcloud.component";
import { MusicPlayerYoutubeComponent } from "../../../game/music-player/music-player-youtube/music-player-youtube.component";

import { Player } from 'src/app/game/game-model/player';
import { PlayerDisplayComponent } from "../../../game/game-display/player-display.component";
import { UserConfigService } from 'src/app/services/userconfig.service';

@Component({
  selector: 'app-test-note',
  templateUrl: './test-note.component.html',
  styleUrls: ['./test-note.component.scss'],
  standalone: true,
  imports: [MusicPlayerYoutubeComponent, MusicPlayerSoundcloudComponent, PlayerDisplayComponent]
})
export class TestNoteComponent implements OnInit, OnDestroy {
  //#region App Constants
  readonly ArrowDirection = ArrowDirection;
  readonly MusicOrigin = MusicOrigin;
  //#endregion

  private modalController = inject(ModalController);
  private userConfigService = inject(UserConfigService);

  @Input() noteData!: NoteDataDto;
  @Input() music!: MusicDto;
  musicOrigin: MusicOrigin | null = null

  @ViewChild(PlayerDisplayComponent)
  playerDisplay!: PlayerDisplayComponent;

  game: GameManager | null = null;

  ngOnInit() {
    this.musicOrigin = MusicPlayerCommon.pickMusicPlayer(this.music.music!);

  }

  onPlayerReady(musicPlayer: IMusicPlayer) {
    const player = this.userConfigService.players[0] || new Player();
    this.game = new GameManager(this.music, [player], [0], true, null!, null!);
    this.game.registerExternalComponents(musicPlayer);
    this.game.startGame();
  }

  dismiss() {
    this.modalController.dismiss();
  }

  ngOnDestroy(): void {
    this.game?.destroyGame();
  }

}
