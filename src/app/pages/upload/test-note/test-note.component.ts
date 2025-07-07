import { Component, Input, OnInit, Query, ViewChild, ViewChildren } from '@angular/core';
import { IMusicPlayer, MusicOrigin, MusicPlayerCommon } from 'src/app/game/musicPlayer/IMusicPlayer';
import { MusicDto, NoteDataDto } from 'src/app/game/gameModel/music.dto';

import { ArrowDirection } from 'src/app/game/constants/arrow-direction.enum';
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

  @ViewChild(PlayerDisplayComponent)
  playerDisplay!: PlayerDisplayComponent;
  musicPlayer: IMusicPlayer | undefined;
  player: Player | undefined;
  gameRound: GameRound | undefined;
  musicOrigin: MusicOrigin | null = null

  zeroTimeStamp: number | undefined;
  gameLoopId: number | undefined;

  constructor(private modalController: ModalController, private userConfigService: UserConfigService) {
  }

  ngOnInit() {
    this.musicOrigin = MusicPlayerCommon.pickMusicPlayer(this.music.music!);
    this.player = this.userConfigService.players[0] || new Player();
    this.gameRound = new GameRound(this.music, this.noteData, this.player, true);
  }


  onPlayerReady(player: IMusicPlayer) {
    this.musicPlayer = player
    this.musicPlayer.play()
    this.zeroTimeStamp = Math.round(performance.now()) + (this.music!.offset ?? 0) * 1000;
    this.gameGlobalLoop(this.zeroTimeStamp)
  }



  private gameGlobalLoop(currentTimestamp: DOMHighResTimeStamp): void {
    const roundedTimestamp = Math.round(currentTimestamp)
    const elapsedTime = (roundedTimestamp - this.zeroTimeStamp!) / 1000; // In seconds

    this.gameRound?.gameLoop(elapsedTime)

    this.playerDisplay.Update()

    // Schedule the next loop iteration
    this.gameLoopId = requestAnimationFrame(this.gameGlobalLoop.bind(this));
  }



  dismiss() {
    this.modalController.dismiss();
  }

  ngOnDestroy(): void {
    this.musicPlayer?.stop();
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
    }
  }

}
