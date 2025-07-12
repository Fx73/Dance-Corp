import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { IMusicPlayer, MusicPlayerCommon } from '../IMusicPlayer';

import { Soundcloud } from 'soundcloud.ts';

declare var SC: any;

@Component({
  selector: 'app-music-player-soundcloud',
  templateUrl: './music-player-soundcloud.component.html',
  styleUrls: ['./music-player-soundcloud.component.scss'],
  standalone: true,
})
export class MusicPlayerSoundcloudComponent extends MusicPlayerCommon
  implements IMusicPlayer, OnInit, AfterViewInit {

  @Input()
  musicUrl!: string;
  @Output()
  onReady: EventEmitter<IMusicPlayer> = new EventEmitter<IMusicPlayer>();

  readonly soundcloud = new Soundcloud();

  widgetSC: any;



  async ngOnInit(): Promise<void> {

    const iframe = document.getElementById('sc-player') as HTMLIFrameElement;
    this.widgetSC = SC.Widget(iframe);
    this.widgetSC.load(this.musicUrl);
    this.widgetSC.bind(SC.Widget.Events.READY, () => this.onReady.emit(this));
  }

  ngAfterViewInit() { }

  play() {
    this.widgetSC.play();
  }

  stop() {
    this.widgetSC.pause();
  }

  getCurrentTime(): number {
    return this.widgetSC;
  }

  setToTime(time: number): void {
    this.widgetSC.seekTo(time);
  }
}
