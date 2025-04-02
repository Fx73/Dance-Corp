import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PadTestPage } from './pad-test.page';

describe('PadTestPage', () => {
  let component: PadTestPage;
  let fixture: ComponentFixture<PadTestPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PadTestPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
