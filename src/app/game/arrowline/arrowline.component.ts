import { Component, Input, OnInit } from '@angular/core';

import { ArrowComponent } from './arrow/arrow.component';
import { ArrowDirection } from 'src/app/shared/enumeration/arrow-direction.enum';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-arrowline',
  templateUrl: './arrowline.component.html',
  styleUrls: ['./arrowline.component.scss'],
  imports: [ArrowComponent, CommonModule]
})
export class ArrowlineComponent implements OnInit {
  readonly ArrowDirection = ArrowDirection;
  @Input()
  beatDivision: number = 1;

  @Input()
  arrows: Uint8Array = new Uint8Array(4);

  constructor() { }

  ngOnInit() { }

}
