import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild, input } from '@angular/core';
import { ArrowColor, ArrowImageManager } from './arrowImageManager';

import { Arrow } from '../gameModel/arrow';
import { ArrowDirection } from 'src/app/shared/enumeration/arrow-direction.enum';
import { GameRound } from '../gameModel/gameRound';

@Component({
  selector: 'app-player-display',
  templateUrl: './player-display.component.html',
  styleUrls: ['./player-display.component.scss'],
})
export class PlayerDisplayComponent implements AfterViewInit {
  //#region App Constants
  readonly ArrowDirection = ArrowDirection;
  readonly BEAT_INTERVAL = 150; //px
  readonly TARGET_PERCENT = 0.1 // % from top;
  readonly ARROW_SIZE = ArrowImageManager.ARROW_SIZE //px
  //#endregion

  @Input() gameRound!: GameRound;

  @ViewChild('gameCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>
  private ctx!: CanvasRenderingContext2D;

  private currentVisibleArrows: Arrow[] = []; // Currently visible arrows
  private currentArrowVisibleIndex: number = 0; // Index of the next not arrow in arrowMap
  targetY = this.TARGET_PERCENT;

  constructor() {
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = window.innerWidth / 2
    canvas.height = window.innerHeight
    const container = canvas.parentElement;
    if (container) {
      container.style.width = `${window.innerWidth / 2}px`;
      container.style.height = `${window.innerHeight}px`;
    }
    this.targetY = canvas.height * this.TARGET_PERCENT
    this.ctx = canvas.getContext('2d')!;
  }

  getPerformanceColor(): string {
    if (this.gameRound.performance > 60) {
      return 'green';
    } else if (this.gameRound.performance > 30) {
      return 'yellow';
    }
    return 'red';
  }

  public UpdateCanvas() {
    const currentBeat = this.gameRound.currentBeat;

    // Clean the canvas
    const canvas = this.canvasRef.nativeElement;
    const canvasHeight = canvas.height;
    const canvasWidth = canvas.width;
    this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);


    // Update visible Arrows
    this.currentVisibleArrows = this.currentVisibleArrows.filter(arrow => arrow.beatPosition > currentBeat - 2);

    const arrowMap = this.gameRound.arrowMap;
    while (this.currentArrowVisibleIndex < arrowMap.length && arrowMap[this.currentArrowVisibleIndex].beatPosition <= currentBeat + 8) {
      this.currentVisibleArrows.push(arrowMap[this.currentArrowVisibleIndex]);
      console.log("PUSHED ARROW" + arrowMap[this.currentArrowVisibleIndex].beatPosition)
      this.currentArrowVisibleIndex++;
    }

    // Build Canvas
    this.RenderBars(canvas, currentBeat);
    this.RenderArrows(this.currentVisibleArrows, canvas, currentBeat);
  }

  private RenderBars(canvas: HTMLCanvasElement, currentBeat: number) {
    // Calculate the vertical offset for the `currentBeat` bar
    const baseOffset = this.targetY - (currentBeat % 1) * this.BEAT_INTERVAL;

    // Draw the visible bars around the `currentBeat`
    for (let i = -10; i <= 10; i++) {
      const beatY = baseOffset + i * this.BEAT_INTERVAL;
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


  private RenderArrows(arrows: Arrow[], canvas: HTMLCanvasElement, currentBeat: number) {
    for (const arrow of arrows) {
      const arrowY = this.targetY + (arrow.beatPosition - currentBeat) * this.BEAT_INTERVAL;
      const arrowX = canvas.width * ((arrow.direction + 1) * 0.2)
      this.DrawArrow(arrow, arrowX, arrowY)
    }
  }

  private DrawArrow(arrow: Arrow, x: number, y: number): void {
    // Set styles based on arrow status
    if (arrow.isValid) {
      this.ctx.fillStyle = "#00ff00"; // Bright green for valid arrows
    } else if (arrow.isMissed) {
      this.ctx.fillStyle = "rgba(255, 0, 0, 0.5)"; // Semi-transparent red for missed arrows
    } else {
      this.ctx.fillStyle = "#ffffff"; // Normal white for unvalidated arrows
    }

    // Draw the arrow
    const arrowImage = ArrowImageManager.getArrowImage(arrow.color, arrow.direction);
    this.ctx.drawImage(arrowImage, x - arrowImage.width / 2, y - arrowImage.height / 2);
  }



}


