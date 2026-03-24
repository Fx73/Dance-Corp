import { AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';

import { CONFIG } from 'src/app/game/constants/game-config';
import { DifficultyCriteria } from 'src/app/pages/upload/DifficultyCriteria';

@Component({
  selector: 'app-radar-score',
  templateUrl: './radar-score.component.html',
  styleUrls: ['./radar-score.component.scss'],
  standalone: true
})
export class RadarScoreComponent implements AfterViewInit, OnChanges {
  readonly labels = ["Endurance", "Speed", "Technical", "Burst", "Chaos"];
  readonly normalizationFactor = [200, 300, 30, 10, 10];

  @Input() scores: DifficultyCriteria[] = [];

  @Input() size: number = 200;

  @ViewChild('radar') radar!: ElementRef<HTMLCanvasElement>;

  constructor() { }

  ngAfterViewInit() {
    this.drawRadar();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['size'] || changes['scores']) {
      this.drawRadar();
    }
  }

  private drawRadar(): void {
    if (!this.radar) {
      return;
    }

    const canvas = this.radar.nativeElement;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.max(20, Math.min(centerX, centerY) - 20);
    const angleStep = (Math.PI * 2) / this.labels.length;

    // 2) Draw axes
    for (let i = 0; i < this.labels.length; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      ctx.strokeStyle = "#999";
      ctx.lineWidth = 0.1;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Label
      ctx.fillStyle = "#555555";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const labelRadius = radius + 15;
      const lx = centerX + Math.cos(angle) * labelRadius;
      const ly = centerY + Math.sin(angle) * labelRadius;

      ctx.fillText(this.labels[i], lx, ly);
    }

    //3) Draw perimeters
    ctx.beginPath();
    ctx.strokeStyle = "#bbbbbb";
    ctx.lineWidth = 1;

    for (let i = 0; i < this.labels.length; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke()

    ctx.setLineDash([4, 4])
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 0.1;

    const levels = 3;
    for (let level = 1; level <= levels; level++) {
      const r = (radius * level) / levels;

      ctx.beginPath();
      for (let i = 0; i < this.labels.length; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.setLineDash([])
    // 5) Fill background
    ctx.beginPath();
    ctx.fillStyle = "rgba(200, 200, 200, 0.04)"; // gris très léger

    for (let i = 0; i < this.labels.length; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.fill();


    // 4) Draw one polygon per score set
    for (let scoreIndex = 0; scoreIndex < this.scores.length; scoreIndex++) {
      const score = this.scores[scoreIndex];
      const values = this.labels.map((label, index) => {
        const rawValue = score[label.toLowerCase()] ?? 0;
        const factor = this.normalizationFactor[index] ?? 1;
        return Math.min(Math.max(rawValue / factor, 0), 1);
      });

      const color = CONFIG.PLAYER_COLORS[scoreIndex % CONFIG.PLAYER_COLORS.length];
      ctx.beginPath();
      ctx.strokeStyle = color.stroke;
      ctx.fillStyle = color.fill;
      ctx.lineWidth = 2;

      for (let i = 0; i < values.length; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const r = radius * values[i];
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
}
