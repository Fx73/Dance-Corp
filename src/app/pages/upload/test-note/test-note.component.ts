import { Component, Input, OnInit, Query, ViewChild, ViewChildren } from '@angular/core';
import { IMusicPlayer, MusicOrigin, MusicPlayerCommon } from 'src/app/game/musicPlayer/IMusicPlayer';
import { MusicDto, NoteDataDto } from 'src/app/game/gameModel/music.dto';

import { ArrowDirection } from 'src/app/game/constants/arrow-direction.enum';
import { GameManager } from 'src/app/game/game.manager';
import { GameRound } from 'src/app/game/gameModel/gameRound';
import { IonicModule } from '@ionic/angular';
import { ModalController } from '@ionic/angular/standalone';
import { MusicPlayerSoundcloudComponent } from "../../../game/musicPlayer/music-player-soundcloud/music-player-soundcloud.component";
import { MusicPlayerYoutubeComponent } from "../../../game/musicPlayer/music-player-youtube/music-player-youtube.component";
import { NgIf } from '@angular/common';
import { Player } from 'src/app/game/gameModel/player';
import { PlayerDisplayComponent } from "../../../game/gameDisplay/player-display.component";
import { UserConfigService } from 'src/app/services/userconfig.service';

@Component({
  selector: 'app-test-note',
  templateUrl: './test-note.component.html',
  styleUrls: ['./test-note.component.scss'],
  standalone: true,
  imports: [IonicModule, MusicPlayerYoutubeComponent, MusicPlayerSoundcloudComponent, PlayerDisplayComponent, NgIf]
})
export class TestNoteComponent implements OnInit {
  //#region App Constants
  readonly ArrowDirection = ArrowDirection;
  readonly MusicOrigin = MusicOrigin;
  //#endregion
  @Input() noteData!: NoteDataDto;
  @Input() music!: MusicDto;
  musicOrigin: MusicOrigin | null = null

  @ViewChild(PlayerDisplayComponent)
  playerDisplay!: PlayerDisplayComponent;

  game: GameManager | null = null;



  constructor(private modalController: ModalController, private userConfigService: UserConfigService) {
  }

  ngOnInit() {
    this.musicOrigin = MusicPlayerCommon.pickMusicPlayer(this.music.music!);

  }


  onPlayerReady(musicPlayer: IMusicPlayer) {
    const player = this.userConfigService.players[0] || new Player();
    this.game = new GameManager(this.music!, [player], true, null!);
    this.game.registerExternalComponents(musicPlayer);
    this.game.startGame();
  }



  dismiss() {
    this.modalController.dismiss();
  }

  ngOnDestroy(): void {
    this.game?.gameDestroy();
  }

}
