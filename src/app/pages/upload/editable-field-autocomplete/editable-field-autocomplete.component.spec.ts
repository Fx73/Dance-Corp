import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { IonicModule } from '@ionic/angular';
import { MusicEditableFieldAutocompleteComponent } from './editable-field-autocomplete.component';

describe('MusicEditableFieldAutocompleteComponent', () => {
  let component: MusicEditableFieldAutocompleteComponent;
  let fixture: ComponentFixture<MusicEditableFieldAutocompleteComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [MusicEditableFieldAutocompleteComponent],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(MusicEditableFieldAutocompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
