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
  private precisionTextElement: HTMLElement[] = [];
  private precisionTextTimeout: (NodeJS.Timeout | null)[] = [null, null, null, null];
  private comboTextElement!: HTMLElement;
  private comboTextTimeout: NodeJS.Timeout | null = null;

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

    this.precisionTextElement.push(document.getElementById('precision-text-left')!);
    this.precisionTextElement.push(document.getElementById('precision-text-down')!);
    this.precisionTextElement.push(document.getElementById('precision-text-up')!);
    this.precisionTextElement.push(document.getElementById('precision-text-right')!);
    this.comboTextElement = document.getElementById('combo-text')!;

    this.loopUpdate();
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

  getDisplayScore(): string {
    return Math.round(this.gameRound.score).toLocaleString('fr-FR');
  }

  private loopUpdate() {
    if (this.gameRound.isFailed || this.gameRound.isFinished) {
      return;
    }
    this.Update(this.gameRound.currentBeat);
    requestAnimationFrame(() => this.loopUpdate());
  }

  public Update(currentBeat: number): void {
    this.UpdateCanvas(currentBeat)

    if (this.gameRound.precisionMessage.length > 0) {
      for (const msg of this.gameRound.precisionMessage) {
        if (msg.type === ArrowType.Tap)
          this.showPrecisionMessage(msg.precision!, msg.direction)
        else if (msg.type === ArrowType.Hold)
          this.showPrecisionMessage(msg.isValid ? Precision.Ok : msg.precision!, msg.direction)
      }
      this.gameRound.precisionMessage = [];
    }


  }

  private UpdateCanvas(currentBeat: number): void {
    // Clean the canvas
    const canvas = this.canvasRef.nativeElement;
    const canvasHeight = canvas.height;
    const canvasWidth = canvas.width;
    this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);


    // Update visible Arrows
    this.updateArrowList(currentBeat)

    // Build Canvas
    if (this.userConfigService.getConfig()['showBars'])
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

    this.currentVisibleArrows = this.currentVisibleArrows.filter(arrow => !arrow.isValid);


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
    this.ctx.globalAlpha = arrow.isPressed ? 1 : 0.5;
    this.ctx.drawImage(holdCenterImage, x - holdCenterImage.width / 2, y);
    this.ctx.globalAlpha = 1;
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
  showPrecisionMessage(precision: Precision, direction: ArrowDirection): void {
    if (this.precisionTextTimeout[direction]) {
      clearTimeout(this.precisionTextTimeout[direction]);
    }

    const element = this.precisionTextElement[direction];
    element.textContent = precision;
    const randomRotation = (Math.random() * 40 - 20).toFixed(2); // Rotation between -20° et +20°
    element.style.setProperty('transform', `translate(-50%, -50%) scale(1) rotate(${randomRotation}deg)`);
    element.style.setProperty('--gradient-color', Color.precisionGradient(precision));
    element.style.setProperty('--rotate-angle', `${randomRotation}deg`);


    // Trigger the CSS animation
    void element.offsetWidth; // Force reflow to restart animation
    element.classList.remove('show'); // Reset animation if active
    element.classList.add('show');

    // Hide the message after 1 second
    this.precisionTextTimeout[direction] = setTimeout(() => {
      element.classList.remove('show');
    }, 500);
  }

  showComboMessage(combo: number): void {
    if (this.comboTextTimeout) {
      clearTimeout(this.comboTextTimeout);
    }

    this.comboTextElement.textContent = `Combo x${combo}`;
    this.comboTextElement.style.setProperty('--gradient-color', `linear-gradient(to bottom, var(--gradient-color, rgb(${Math.min(214 + combo, 255)}, 243, 48)), rgb(${Math.min(240 + combo, 255)}, 111, 111))`);

    // Trigger the CSS animation
    void this.comboTextElement.offsetWidth; // Force reflow to restart animation
    this.comboTextElement.classList.remove('show'); // Reset animation if active
    this.comboTextElement.classList.add('show');

    // Hide
    if (combo < 4) {
      this.comboTextTimeout = setTimeout(() => {
        this.comboTextElement.classList.remove('show');
      }, 1);
    }
  }
  //#endregion


}


