import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild, input } from '@angular/core';
import { ArrowColor, ArrowImageManager } from './arrowImageManager';

import { Arrow } from '../gameModel/arrow';
import { ArrowDirection } from 'src/app/game/constants/arrow-direction.enum';
import { ArrowType } from '../constants/arrow-type.enum';
import { CONFIG } from '../constants/game-config';
import { Color } from '../constants/color';
import { CommonModule } from '@angular/common';
import { GameRound } from '../gameModel/gameRound';
import { Precision } from '../constants/precision.enum';
import { UserConfigService } from 'src/app/services/userconfig.service';

@Component({
  selector: 'app-player-display',
  templateUrl: './player-display.component.html',
  styleUrls: ['./player-display.component.scss'],
  imports: [CommonModule]
})
export class PlayerDisplayComponent implements AfterViewInit {
  //#region App Constants
  readonly ArrowDirection = ArrowDirection;
  readonly ARROW_SIZE = ArrowImageManager.ARROW_SIZE //px
  //#endregion

  @Input() gameRound!: GameRound;

  //#region Displayed Elemments
  @ViewChild('gameCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>
  private ctx!: CanvasRenderingContext2D;
  arrowTargets: Map<ArrowDirection, HTMLElement> = new Map();
  private precisionTextElement!: HTMLElement;
  private precisionTextTimeout: NodeJS.Timeout | null = null;
  //#endregion

  private currentVisibleArrows: Arrow[] = []; // Currently visible arrows
  private currentArrowVisibleIndex: number = 0; // Index of the next not arrow in arrowMap
  targetY = CONFIG.DISPLAY.TARGET_PERCENT;

  constructor(private userConfigService: UserConfigService) {
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = this.userConfigService.getConfig()['canvasWidth']
    canvas.height = this.userConfigService.getConfig()['canvasHeight']
    const container = canvas.parentElement;
    if (container) {
      container.style.width = `${canvas.width}px`;
      container.style.height = `${canvas.height}px`;
    }
    this.targetY = canvas.height * CONFIG.DISPLAY.TARGET_PERCENT
    this.ctx = canvas.getContext('2d')!;

    this.precisionTextElement = document.getElementById('precision-text')!;
  }

  get arrowCorrectedSize(): number {
    return this.ARROW_SIZE / Math.sqrt(2);
  }

  getPerformanceColor(): string {
    if (this.gameRound.performance > 60) {
      return 'green';
    } else if (this.gameRound.performance > 30) {
      return 'yellow';
    }
    return 'red';
  }

  getConfigValue<T>(key: any): T {
    return this.userConfigService.getConfig()[key] as T;
  }
  public Update() {
    this.UpdateCanvas()

    if (this.gameRound.precisionMessage) {
      this.showPrecisionMessage(this.gameRound.precisionMessage)
      this.gameRound.precisionMessage = null;
    }


  }

  private UpdateCanvas() {
    const currentBeat = this.gameRound.currentBeat;

    // Clean the canvas
    const canvas = this.canvasRef.nativeElement;
    const canvasHeight = canvas.height;
    const canvasWidth = canvas.width;
    this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);


    // Update visible Arrows
    this.updateArrowList(currentBeat)

    // Build Canvas
    this.RenderBars(canvas, currentBeat);
    this.RenderArrows(this.currentVisibleArrows, canvas, currentBeat);
  }

  //#region Bars
  private RenderBars(canvas: HTMLCanvasElement, currentBeat: number) {
    // Calculate the vertical offset for the `currentBeat` bar
    const baseOffset = this.targetY - (currentBeat % 1) * CONFIG.DISPLAY.BEAT_INTERVAL;

    // Draw the visible bars around the `currentBeat`
    for (let i = -10; i <= 10; i++) {
      const beatY = baseOffset + i * CONFIG.DISPLAY.BEAT_INTERVAL;
      if (beatY >= 0 && beatY <= canvas.height) {
        const beatNumber = Math.floor(currentBeat) + i;
        const isMeasure = beatNumber % 4 === 0;
        this.drawBeatBar(beatY, isMeasure ? 2 : 1);

        if (isMeasure) {
          const measureNumber = Math.floor(beatNumber / 4); // Calculate measure number
          this.drawMeasureNumber(measureNumber, beatY, canvas.width);
        }
      }
    }
  }

  private drawBeatBar(y: number, lineWidth: number): void {
    const canvasWidth = this.canvasRef.nativeElement.width;

    this.ctx.fillStyle = '#ffffff'; // White color for bars
    this.ctx.fillRect(0, y, canvasWidth, lineWidth); // Horizontal bar spanning the width
  }

  private drawMeasureNumber(measureNumber: number, y: number, canvasWidth: number): void {
    this.ctx.fillStyle = '#ffffff'; // White text color
    this.ctx.font = '14px Arial'; // Font size and type
    this.ctx.textAlign = 'left'; // Align the text to the left
    this.ctx.textBaseline = 'middle'; // Vertically center the text relative to the Y position
    this.ctx.fillText(`${measureNumber}`, 10, y - 5); // Draw the text slightly above the bar
  }
  //#endregion

  //#region Arrows
  private updateArrowList(currentBeat: number): void {
    // Remove outdated arrows
    while (this.currentVisibleArrows.length > 0 && ((this.currentVisibleArrows[0].beatEnd ?? this.currentVisibleArrows[0].beatPosition) <= currentBeat - 2)) {
      this.currentVisibleArrows.shift();
    }

    this.currentVisibleArrows = this.currentVisibleArrows.filter(arrow => !arrow.isPerfect);


    // Add new arrows to the queue if they fall within the visible window [currentBeat, currentBeat + 8]
    const arrowMap = this.gameRound.arrowMap;
    while (this.currentArrowVisibleIndex < arrowMap.length && arrowMap[this.currentArrowVisibleIndex].beatPosition <= currentBeat + 8) {
      const arrow = arrowMap[this.currentArrowVisibleIndex];
      this.currentVisibleArrows.push(arrow);
      this.currentArrowVisibleIndex++;
    }
  }

  private RenderArrows(arrows: Arrow[], canvas: HTMLCanvasElement, currentBeat: number) {
    for (const arrow of arrows) {
      const arrowY = this.targetY + (arrow.beatPosition - currentBeat) * CONFIG.DISPLAY.BEAT_INTERVAL;
      const arrowX = canvas.width * ((arrow.direction + 0.5) * 0.25)

      if (arrow.type === ArrowType.Hold) {
        const arrowEndY = this.targetY + (arrow.beatEnd! - currentBeat) * CONFIG.DISPLAY.BEAT_INTERVAL;
        this.DrawHold(arrow, arrowX, arrowY, arrowEndY)
      }

      this.DrawArrow(arrow, arrowX, arrowY)
    }
  }

  private DrawHold(arrow: Arrow, x: number, y: number, yend: number) {
    const holdCenterImage = ArrowImageManager.getHoldForDistance(yend - y);
    this.ctx.drawImage(holdCenterImage, x - holdCenterImage.width / 2, y);
  }

  private DrawArrow(arrow: Arrow, x: number, y: number): void {
    if (arrow.isMissed) {
      this.ctx.filter = 'brightness(50%)'; // Darken the arrow
      this.ctx.shadowColor = 'white'; // White glow for contrast
      this.ctx.shadowBlur = 10; // Add a soft glow effect
    }

    // Draw the arrow
    const arrowImage = ArrowImageManager.getArrowImage(arrow.color, arrow.direction);
    this.ctx.drawImage(arrowImage, x - arrowImage.width / 2, y - arrowImage.height / 2);

    // Reset shadow and filter settings
    if (arrow.isMissed) {
      this.ctx.filter = 'none';
      this.ctx.shadowColor = 'transparent';
      this.ctx.shadowBlur = 0;
    }
  }

  //#region 

  //#region Player Precision
  showPrecisionMessage(precision: Precision): void {
    if (this.precisionTextTimeout) {
      clearTimeout(this.precisionTextTimeout);
    }
    this.precisionTextElement.textContent = precision;
    this.precisionTextElement.style.setProperty('--gradient-color', Color.precisionGradient(precision));

    // Trigger the CSS animation
    this.precisionTextElement.classList.remove('show'); // Reset animation if active
    void this.precisionTextElement.offsetWidth; // Force reflow to restart animation
    this.precisionTextElement.classList.add('show');

    // Hide the message after 1 second
    this.precisionTextTimeout = setTimeout(() => {
      this.precisionTextElement.classList.remove('show');
    }, 1000);
  }

  //#endregion


}


