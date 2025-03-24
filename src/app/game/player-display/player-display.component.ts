import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-player-display',
  templateUrl: './player-display.component.html',
  styleUrls: ['./player-display.component.css']
})
export class PlayerDisplayComponent {
  @Input() playerId: number = 1;
  @Input() score: number = 0;
  @Input() performance: number = 100;

  getPerformanceColor(): string {
    if (this.performance > 60) {
      return 'green';
    } else if (this.performance > 30) {
      return 'yellow';
    }
    return 'red';
  }
}
