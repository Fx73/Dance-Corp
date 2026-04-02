import { Component, Input, OnInit } from '@angular/core';

import { Color } from 'src/app/game/constants/color';
import { IonBadge } from "@ionic/angular/standalone";

@Component({
  selector: 'app-grade',
  templateUrl: './grade.component.html',
  styleUrls: ['./grade.component.scss'],
  imports: [IonBadge]
})
export class GradeComponent implements OnInit {
  @Input()
  score!: number

  @Input()
  failed: boolean = false

  grade: string = 'F'
  color: string = '#000000'

  constructor() { }

  ngOnInit() {
    ({ grade: this.grade, color: this.color } = Color.gradeFromScore(this.score, this.failed));
  }

}
