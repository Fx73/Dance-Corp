import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { MusicPlayerLocalComponent } from './music-player-local.component';

describe('MusicPlayerLocalComponent', () => {
  let component: MusicPlayerLocalComponent;
  let fixture: ComponentFixture<MusicPlayerLocalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MusicPlayerLocalComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(MusicPlayerLocalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
