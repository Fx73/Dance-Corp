import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { IMusicPlayer, MusicPlayerCommon } from '../IMusicPlayer';

//import { Soundcloud } from 'soundcloud.ts';

declare var SC: any;

@Component({
  selector: 'app-music-player-soundcloud',
  templateUrl: './music-player-soundcloud.component.html',
  styleUrls: ['./music-player-soundcloud.component.scss'],
  standalone: true,
})
export class MusicPlayerSoundcloudComponent extends MusicPlayerCommon
  implements IMusicPlayer, OnInit, AfterViewInit, OnDestroy {

  @Input()
  musicUrl!: string;
  @Input()
  startOffset?: number;
  @Output()
  onReady: EventEmitter<IMusicPlayer> = new EventEmitter<IMusicPlayer>();

  widgetSC: any;



  async ngOnInit(): Promise<void> {
    const iframe = document.getElementById('sc-player') as HTMLIFrameElement;
    this.widgetSC = SC.Widget(iframe);
    this.widgetSC.load(this.musicUrl);
    if (this.startOffset !== undefined) {
      this.widgetSC.seekTo(this.startOffset * 1000);
    }
    this.widgetSC.bind(SC.Widget.Events.READY, () => {
      this.widgetSC.setVolume(this.getVolume() * 100);
      if (this.startOffset !== undefined)
        this.widgetSC.seekTo(this.startOffset * 1000);
      this.onReady.emit(this);
    });
  }

  ngAfterViewInit() { }

  play() {
    this.widgetSC.play();
    this.startPolling();
  }

  stop() {
    try {
      this.widgetSC.pause();
    } catch (e) { }
    this.stopPolling();
  }

  //#region CurrentTime management
  private polling: any = null
  private lastKnownTime = 0;
  startPolling() {
    this.polling = setInterval(() => {
      this.widgetSC.getPosition((ms: number) => {
        this.lastKnownTime = ms / 1000;
      });
    }, 100);
  }

  stopPolling() {
    clearInterval(this.polling);
  }


  getCurrentTime(): number {
    return this.lastKnownTime - (this.startOffset ?? 0);
  }
  //#endregion


  setToTime(time: number): void {
    this.widgetSC.seekTo((time + (this.startOffset ?? 0)) * 1000);
  }

  ngOnDestroy() {
    this.stopPolling();
  }
}
