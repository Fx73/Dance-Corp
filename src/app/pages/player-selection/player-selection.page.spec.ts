import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayerSelectionPage } from './player-selection.page';

describe('PlayerSelectionPage', () => {
  let component: PlayerSelectionPage;
  let fixture: ComponentFixture<PlayerSelectionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayerSelectionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
