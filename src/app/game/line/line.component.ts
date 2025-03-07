import { ArrowComponent, ArrowDirection } from '../arrow/arrow.component';
import { Component, Input, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-line',
  templateUrl: './line.component.html',
  styleUrls: ['./line.component.scss'],
  imports: [ArrowComponent, CommonModule]
})
export class LineComponent implements OnInit {
  @Input() arrows: { direction: ArrowDirection }[] = [];
  @Input() position: number = 0; // Position de la ligne en pourcentage

  constructor() { }

  ngOnInit(): void {
  }
}
