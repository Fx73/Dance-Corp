import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';

import { IMusicPlayer } from '../IMusicPlayer';

@Component({
  selector: 'app-music-player-soundcloud',
  templateUrl: './music-player-soundcloud.component.html',
  styleUrls: ['./music-player-soundcloud.component.scss'],
})

export class MusicPlayerSoundcloudComponent implements IMusicPlayer, OnInit, AfterViewInit {

  @Input()
  musicUrl!: string;
  @Output()
  onReady: EventEmitter<IMusicPlayer> = new EventEmitter<IMusicPlayer>();

  //readonly soundcloud = new Soundcloud()



  async ngOnInit(): Promise<void> {
    //const track = await this.soundcloud.tracks.get(this.musicUrl);
    //console.log(track);

  }

  ngAfterViewInit() {

  }

  play() {

  }

  stop() {

  }

  getCurrentTime(): number {
    return 0
  }

  setToTime(time: number): void {
    throw new Error('Method not implemented.');
  }
}