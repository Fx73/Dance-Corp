import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { MusicPlayerSoundcloudComponent } from './music-player-soundcloud.component';

describe('MusicPlayerSoundcloudComponent', () => {
  let component: MusicPlayerSoundcloudComponent;
  let fixture: ComponentFixture<MusicPlayerSoundcloudComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MusicPlayerSoundcloudComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(MusicPlayerSoundcloudComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
